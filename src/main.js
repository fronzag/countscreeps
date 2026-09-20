const CONFIG = require("config");
const { cleanMemory } = require("memory");
const { planRoom } = require("planner");
const { runSpawnManager } = require("spawnManager");
const { runHarvester } = require("role.harvester");
const { runUpgrader } = require("role.upgrader");
const { runBuilder } = require("role.builder");
const { runTowers } = require("towerManager");
const { rescueBorderCreeps } = require("movement");
const { recordTelemetry, printStatus } = require("status");

module.exports.loop = function () {
    cleanMemory();

    const room = Game.rooms[CONFIG.roomName];
    const spawn = Game.spawns[CONFIG.spawnName];

    if (!room || !spawn) {
        console.log(`[ERROR] Room ${CONFIG.roomName} ou spawn ${CONFIG.spawnName} nao encontrado.`);
        return;
    }

    if (!room.controller || !room.controller.my || spawn.room.name !== room.name) {
        console.log(`[ERROR] A room ${CONFIG.roomName} nao esta sob nosso controle.`);
        return;
    }

    rescueBorderCreeps(room);
    runTowers(room);

    if (Game.time % CONFIG.plannerInterval === 0) {
        planRoom(room, spawn);
    }

    runSpawnManager(spawn, room);

    for (const creep of room.find(FIND_MY_CREEPS)) {
        if (creep.memory.borderRescue === Game.time) continue;

        switch (creep.memory.role) {
            case "harvester": runHarvester(creep, room); break;
            case "upgrader": runUpgrader(creep, room); break;
            case "builder": runBuilder(creep, room); break;
            default: console.log(`[WARN] ${creep.name} sem role valida.`);
        }
    }

    if (Game.time % CONFIG.telemetryInterval === 0) recordTelemetry(room, spawn);
    if (Game.time % CONFIG.statusInterval === 0) printStatus(room);
};
