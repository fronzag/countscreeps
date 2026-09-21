const CONFIG = require("config");

const ROLES = ["miner", "hauler", "harvester", "upgrader", "builder"];

function emptyCounts() {
    return { miner: 0, hauler: 0, harvester: 0, upgrader: 0, builder: 0 };
}

function countRolesInRoom(room, viableOnly) {
    const counts = emptyCounts();
    for (const creep of room.find(FIND_MY_CREEPS)) {
        const role = creep.memory.role;
        if (counts[role] === undefined) continue;
        if (viableOnly && creep.ticksToLive !== undefined && creep.ticksToLive <= replacementThreshold(creep)) continue;
        counts[role]++;
    }
    return counts;
}

function replacementThreshold(creep) {
    return creep.body.length * CREEP_SPAWN_TIME + CONFIG.replacementLeadTicks;
}

function targetsForRoom(room) {
    const base = CONFIG.population[room.controller.level] || CONFIG.population[4];
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    const criticalSites = sites.filter(site => site.structureType !== STRUCTURE_ROAD &&
        site.structureType !== STRUCTURE_WALL && site.structureType !== STRUCTURE_RAMPART).length;
    return {
        miner: base.miner,
        hauler: room.controller.level >= 2 ? requiredHaulers(room) : base.hauler,
        harvester: base.harvester,
        upgrader: base.upgrader,
        builder: criticalSites > 0 ? base.builder : (sites.length > 0 ? 1 : 0)
    };
}

function runSpawnManager(spawn, room) {
    if (spawn.spawning) return;

    const actual = countRolesInRoom(room, false);
    const viable = countRolesInRoom(room, true);
    const targets = targetsForRoom(room);
    let role = null;

    const carriers = actual.hauler + actual.harvester;
    if (carriers === 0) role = "harvester";
    else if (viable.miner < targets.miner) role = "miner";
    else if (viable.hauler < targets.hauler) role = "hauler";
    else if (viable.builder < targets.builder) role = "builder";
    else if (viable.upgrader < targets.upgrader) role = "upgrader";
    else if (viable.harvester < targets.harvester) role = "harvester";
    if (!role) return;

    const emergency = carriers === 0;
    const budget = emergency ? room.energyAvailable : room.energyCapacityAvailable;
    const body = getBody(role, budget, emergency);
    const cost = getBodyCost(body);
    if (room.energyAvailable < cost) return;

    const memory = { role, working: false, born: Game.time };
    if (role === "miner") memory.sourceId = sourceForNewWorker(room, "miner");
    if (role === "hauler") memory.sourceId = sourceForNewWorker(room, "hauler");
    const name = `${role}-${Game.time}`;
    const result = spawn.spawnCreep(body, name, { memory });
    if (result === OK) console.log(`[SPAWN] ${name} (${cost} energy)`);
    else console.log(`[SPAWN_ERROR] ${role}: ${result}`);
}

function sourceForNewWorker(room, role) {
    const sources = room.find(FIND_SOURCES).sort((a, b) => a.id.localeCompare(b.id));
    const assigned = {};
    for (const source of sources) assigned[source.id] = 0;
    for (const creep of room.find(FIND_MY_CREEPS)) {
        if (creep.ticksToLive !== undefined && creep.ticksToLive <= replacementThreshold(creep)) continue;
        if (creep.memory.role === role && assigned[creep.memory.sourceId] !== undefined) {
            assigned[creep.memory.sourceId]++;
        }
    }
    const quotas = role === "hauler" && Memory.colony.logistics.haulerTarget &&
        Memory.colony.logistics.haulerTarget.bySource;
    sources.sort((a, b) => {
        const quotaA = quotas && quotas[a.id] ? quotas[a.id] : 1;
        const quotaB = quotas && quotas[b.id] ? quotas[b.id] : 1;
        return (assigned[a.id] / quotaA) - (assigned[b.id] / quotaB) || a.id.localeCompare(b.id);
    });
    return sources.length ? sources[0].id : null;
}

function requiredHaulers(room) {
    if (!Memory.colony.logistics) Memory.colony.logistics = {};
    const cache = Memory.colony.logistics.haulerTarget;
    if (cache && cache.bySource && cache.capacity === room.energyCapacityAvailable && Game.time - cache.tick < 1000) {
        return cache.value;
    }
    const spawn = Game.spawns[CONFIG.spawnName];
    if (!spawn) return 2;
    const body = getBody("hauler", room.energyCapacityAvailable, false);
    const carryCapacity = body.filter(part => part === CARRY).length * CARRY_CAPACITY;
    let required = 0;
    const bySource = {};
    for (const source of room.find(FIND_SOURCES)) {
        const distance = room.findPath(source.pos, spawn.pos, {
            ignoreCreeps: true, swampCost: 2, maxRooms: 1
        }).length;
        const sourceTarget = Math.max(1, Math.ceil((distance * 2 * SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME) / carryCapacity));
        bySource[source.id] = sourceTarget;
        required += sourceTarget;
    }
    const value = Math.min(6, required);
    Memory.colony.logistics.haulerTarget = {
        capacity: room.energyCapacityAvailable,
        tick: Game.time,
        value,
        bySource
    };
    return value;
}

function getBody(role, budget, emergency) {
    if (emergency || role === "harvester") return [WORK, CARRY, MOVE];
    if (role === "miner") {
        if (budget >= 550) return [WORK, WORK, WORK, WORK, WORK, MOVE];
        if (budget >= 400) return [WORK, WORK, WORK, MOVE];
        return [WORK, WORK, MOVE];
    }
    if (role === "hauler") {
        const units = Math.max(1, Math.min(5, Math.floor(budget / 150)));
        const body = [];
        for (let i = 0; i < units; i++) body.push(CARRY, CARRY, MOVE);
        return body;
    }
    const units = Math.max(1, Math.min(4, Math.floor(budget / 200)));
    const body = [];
    for (let i = 0; i < units; i++) body.push(WORK, CARRY, MOVE);
    return body;
}

function getBodyCost(body) {
    return body.reduce((total, part) => total + BODYPART_COST[part], 0);
}

module.exports = { runSpawnManager, countRolesInRoom, targetsForRoom, getBodyCost };
