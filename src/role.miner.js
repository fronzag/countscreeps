const { safeMoveTo } = require("movement");
const { addMetric } = require("metrics");

function runMiner(creep, room) {
    const source = balancedSource(creep, room);
    if (!source) return;
    const position = miningPosition(room, source);
    if (!creep.pos.isEqualTo(position)) {
        safeMoveTo(creep, position, { reusePath: 20 });
        return;
    }
    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: structure => structure.structureType === STRUCTURE_CONTAINER
    })[0];
    const droppedEnergy = source.pos.findInRange(FIND_DROPPED_RESOURCES, 2, {
        filter: resource => resource.resourceType === RESOURCE_ENERGY
    }).reduce((sum, resource) => sum + resource.amount, 0);
    if (container && container.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && droppedEnergy >= 500) {
        addMetric("harvestPaused", 1);
        creep.say("PAUSE");
        return;
    }
    const amount = Math.min(source.energy, creep.getActiveBodyparts(WORK) * HARVEST_POWER);
    const result = creep.harvest(source);
    if (result === OK) addMetric("harvested", amount);
}

function balancedSource(creep, room) {
    const sources = room.find(FIND_SOURCES).sort((a, b) => a.id.localeCompare(b.id));
    const miners = room.find(FIND_MY_CREEPS, {
        filter: other => other.memory.role === "miner" && other.memory.sourceId
    });
    const counts = {};
    for (const source of sources) counts[source.id] = 0;
    for (const miner of miners) {
        if (counts[miner.memory.sourceId] !== undefined) counts[miner.memory.sourceId]++;
    }
    const missing = sources.find(source => counts[source.id] === 0);
    const duplicates = miners.filter(miner => miner.memory.sourceId === creep.memory.sourceId)
        .sort((a, b) => (b.memory.born || 0) - (a.memory.born || 0) || b.name.localeCompare(a.name));
    if (missing && duplicates.length > 1 && duplicates[0].id === creep.id) {
        console.log(`[LOGISTICS] ${creep.name} rebalanceado para fonte ${missing.id}`);
        creep.memory.sourceId = missing.id;
        return missing;
    }
    return creep.memory.sourceId ? Game.getObjectById(creep.memory.sourceId) : null;
}

function miningPosition(room, source) {
    const plan = Memory.colony && Memory.colony.plans && Memory.colony.plans.sources[source.id];
    if (plan) return new RoomPosition(plan.x, plan.y, room.name);
    const path = room.findPath(source.pos, Game.spawns[Object.keys(Game.spawns)[0]].pos, {
        ignoreCreeps: true, swampCost: 2, maxRooms: 1
    });
    if (path.length) return new RoomPosition(path[0].x, path[0].y, room.name);
    return source.pos;
}

module.exports = { runMiner };
