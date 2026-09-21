const { countRolesInRoom, targetsForRoom } = require("spawnManager");
const { ensureMetrics } = require("metrics");

function recordTelemetry(room, spawn) {
    const controller = room.controller;
    const counts = countRolesInRoom(room, false);
    const targets = targetsForRoom(room);
    const sources = room.find(FIND_SOURCES);
    const creeps = room.find(FIND_MY_CREEPS);
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    const containers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER });

    Memory.telemetry = {
        schema: 2,
        tick: Game.time,
        shard: Game.shard && Game.shard.name,
        state: colonyState(counts, targets, sites.length, hostiles.length),
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
            targets,
            constructionSites: sites.length,
            hostiles: hostiles.length,
            droppedEnergy: room.find(FIND_DROPPED_RESOURCES, {
                filter: resource => resource.resourceType === RESOURCE_ENERGY
            }).reduce((sum, resource) => sum + resource.amount, 0),
            ttl: {
                minimum: creeps.length ? Math.min.apply(null, creeps.map(c => c.ticksToLive || CREEP_LIFE_TIME)) : 0,
                average: creeps.length ? round(creeps.reduce((sum, c) => sum + (c.ticksToLive || 0), 0) / creeps.length) : 0
            },
            sources: sources.map(source => ({
                id: source.id,
                energy: source.energy,
                ticksToRegeneration: source.ticksToRegeneration,
                containerEnergy: containerEnergyNear(source, containers),
                miners: creeps.filter(creep => creep.memory.role === "miner" && creep.memory.sourceId === source.id).length,
                haulers: creeps.filter(creep => creep.memory.role === "hauler" && creep.memory.sourceId === source.id).length
            })),
            containers: containers.map(container => ({
                id: container.id,
                x: container.pos.x,
                y: container.pos.y,
                energy: container.store[RESOURCE_ENERGY],
                capacity: container.store.getCapacity(RESOURCE_ENERGY)
            }))
        },
        economy: ensureMetrics(),
        logistics: Memory.colony.logistics || {},
        spawn: { name: spawn.name, spawning: spawn.spawning ? spawn.spawning.name : null }
    };
}

function containerEnergyNear(target, containers) {
    const nearby = containers.find(container => container.pos.getRangeTo(target) <= 1);
    return nearby ? nearby.store[RESOURCE_ENERGY] : null;
}

function colonyState(counts, targets, sites, hostiles) {
    if (hostiles > 0) return "DEFEND";
    if (counts.harvester + counts.hauler === 0) return "RECOVERY";
    if (counts.miner < targets.miner || counts.hauler < targets.hauler) return "STABILIZE";
    if (sites > 0) return "BUILD";
    return "GROW";
}

function printStatus(room) {
    const t = Memory.telemetry;
    if (!t || !t.room) return;
    const c = t.room.creeps;
    console.log(`[STATUS] ${room.name} ${t.state} RCL ${t.room.rcl} | energy ${t.room.energyAvailable}/${t.room.energyCapacity} | M:${c.miner} T:${c.hauler} H:${c.harvester} U:${c.upgrader} B:${c.builder} | sites:${t.room.constructionSites} | CPU:${t.cpu.used} bucket:${t.cpu.bucket}`);
}

function round(value) { return Math.round(value * 100) / 100; }

module.exports = { recordTelemetry, printStatus };
