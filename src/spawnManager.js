const CONFIG = require("config");

function countRolesInRoom(room) {
    const counts = { harvester: 0, upgrader: 0, builder: 0 };
    for (const creep of room.find(FIND_MY_CREEPS)) {
        if (counts[creep.memory.role] !== undefined) counts[creep.memory.role]++;
    }
    return counts;
}

function targetsForRoom(room) {
    const base = CONFIG.population[room.controller.level] || CONFIG.population[4];
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
    return {
        harvester: base.harvester,
        upgrader: base.upgrader,
        builder: sites > 0 ? base.builder : 0
    };
}

function runSpawnManager(spawn, room) {
    if (spawn.spawning) return;

    const counts = countRolesInRoom(room);
    const targets = targetsForRoom(room);
    let role = null;
    if (counts.harvester < targets.harvester) role = "harvester";
    else if (counts.builder < targets.builder) role = "builder";
    else if (counts.upgrader < targets.upgrader) role = "upgrader";
    if (!role) return;

    const emergency = counts.harvester === 0;
    const budget = emergency ? room.energyAvailable : room.energyCapacityAvailable;
    const body = getBody(role, budget);
    const cost = getBodyCost(body);
    if (room.energyAvailable < cost) return;

    const name = `${role}-${Game.time}`;
    const result = spawn.spawnCreep(body, name, {
        memory: { role, working: false, born: Game.time }
    });
    if (result === OK) console.log(`[SPAWN] ${name} (${cost} energy)`);
    else console.log(`[SPAWN_ERROR] ${role}: ${result}`);
}

function getBody(role, budget) {
    const body = [];
    const unit = role === "harvester" ? [WORK, CARRY, MOVE] : [WORK, CARRY, MOVE];
    const unitCost = 200;
    const units = Math.max(1, Math.min(4, Math.floor(budget / unitCost)));
    for (let i = 0; i < units; i++) body.push(...unit);
    return body;
}

function getBodyCost(body) {
    return body.reduce((total, part) => total + BODYPART_COST[part], 0);
}

module.exports = { runSpawnManager, countRolesInRoom, targetsForRoom, getBodyCost };
