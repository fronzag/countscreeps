const { countRolesInRoom, targetsForRoom } = require("spawnManager");

function recordTelemetry(room, spawn) {
    const controller = room.controller;
    const counts = countRolesInRoom(room);
    const sources = room.find(FIND_SOURCES);

    Memory.telemetry = {
        schema: 1,
        tick: Game.time,
        shard: Game.shard && Game.shard.name,
        cpu: { used: round(Game.cpu.getUsed()), limit: Game.cpu.limit, bucket: Game.cpu.bucket },
        room: {
            name: room.name,
            rcl: controller.level,
            progress: controller.progress || 0,
            progressTotal: controller.progressTotal || 0,
            ticksToDowngrade: controller.ticksToDowngrade,
            energyAvailable: room.energyAvailable,
            energyCapacity: room.energyCapacityAvailable,
            creeps: counts,
            targets: targetsForRoom(room),
            constructionSites: room.find(FIND_MY_CONSTRUCTION_SITES).length,
            hostiles: room.find(FIND_HOSTILE_CREEPS).length,
            sources: sources.map(source => ({
                id: source.id,
                energy: source.energy,
                ticksToRegeneration: source.ticksToRegeneration
            }))
        },
        spawn: { name: spawn.name, spawning: spawn.spawning ? spawn.spawning.name : null }
    };
}

function printStatus(room) {
    const t = Memory.telemetry;
    if (!t || !t.room) return;
    const c = t.room.creeps;
    console.log(`[STATUS] ${room.name} RCL ${t.room.rcl} | energy ${t.room.energyAvailable}/${t.room.energyCapacity} | H:${c.harvester} U:${c.upgrader} B:${c.builder} | sites:${t.room.constructionSites} | CPU:${t.cpu.used} bucket:${t.cpu.bucket}`);
}

function round(value) { return Math.round(value * 100) / 100; }

module.exports = { recordTelemetry, printStatus };
