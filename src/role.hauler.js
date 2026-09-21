const { safeMoveTo } = require("movement");
const { transferEnergy } = require("creepActions");
const { addMetric } = require("metrics");

function runHauler(creep, room) {
    const source = assignedSource(creep, room);
    if (!source) return;
    if (creep.store[RESOURCE_ENERGY] === 0) creep.memory.delivering = false;
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) creep.memory.delivering = true;

    if (!creep.memory.delivering) return collect(creep, room, source);
    const target = deliveryTarget(creep, room);
    if (target) transferEnergy(creep, target);
}

function assignedSource(creep, room) {
    let source = creep.memory.sourceId && Game.getObjectById(creep.memory.sourceId);
    const sources = room.find(FIND_SOURCES).sort((a, b) => a.id.localeCompare(b.id));
    const quotas = Memory.colony.logistics && Memory.colony.logistics.haulerTarget &&
        Memory.colony.logistics.haulerTarget.bySource;
    const assignments = {};
    for (const item of sources) assignments[item.id] = 0;
    const haulers = room.find(FIND_MY_CREEPS, {
        filter: other => other.memory.role === "hauler" && other.memory.sourceId
    });
    for (const other of haulers) {
        if (assignments[other.memory.sourceId] !== undefined) assignments[other.memory.sourceId]++;
    }
    if (source && quotas) {
        const deficit = sources.find(item => assignments[item.id] < (quotas[item.id] || 1));
        const currentQuota = quotas[source.id] || 1;
        const duplicates = haulers.filter(other => other.memory.sourceId === source.id)
            .sort((a, b) => (b.memory.born || 0) - (a.memory.born || 0) || b.name.localeCompare(a.name));
        if (deficit && assignments[source.id] > currentQuota && duplicates[0].id === creep.id) {
            console.log(`[LOGISTICS] ${creep.name} rebalanceado para fonte ${deficit.id}`);
            creep.memory.sourceId = deficit.id;
            return deficit;
        }
        return source;
    }
    sources.sort((a, b) => {
        const quotaA = quotas && quotas[a.id] ? quotas[a.id] : 1;
        const quotaB = quotas && quotas[b.id] ? quotas[b.id] : 1;
        return (assignments[a.id] / quotaA) - (assignments[b.id] / quotaB) || a.id.localeCompare(b.id);
    });
    source = sources[0];
    if (source) creep.memory.sourceId = source.id;
    return source;
}

function collect(creep, room, source) {
    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
    }).sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])[0];
    const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 2, {
        filter: r => r.resourceType === RESOURCE_ENERGY && r.amount >= 20
    }).sort((a, b) => b.amount - a.amount)[0];
    let target = container;
    if (dropped && (!target || dropped.amount > target.store[RESOURCE_ENERGY])) target = dropped;
    if (!target) {
        safeMoveTo(creep, source, { range: 2, reusePath: 20 });
        return;
    }

    const amount = Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY),
        target.amount !== undefined ? target.amount : target.store[RESOURCE_ENERGY]);
    const result = target.amount !== undefined ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
    if (result === OK) addMetric(target.amount !== undefined ? "pickedUp" : "withdrawn", amount);
    if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, target);
}

function deliveryTarget(creep, room) {
    const primary = room.find(FIND_MY_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_TOWER) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (primary.length) return creep.pos.findClosestByPath(primary);

    const controllerStores = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && room.controller && s.pos.getRangeTo(room.controller) <= 4
    });
    const controllerStore = creep.pos.findClosestByPath(controllerStores);
    if (controllerStore) return controllerStore;

    const workers = room.find(FIND_MY_CREEPS, {
        filter: worker => worker.id !== creep.id &&
            (worker.memory.role === "upgrader" || worker.memory.role === "builder") &&
            worker.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    workers.sort((a, b) => workerPriority(a) - workerPriority(b));
    const priority = workers.length ? workerPriority(workers[0]) : null;
    return creep.pos.findClosestByPath(workers.filter(worker => workerPriority(worker) === priority));
}

function workerPriority(worker) {
    return worker.memory.role === "upgrader" ? 1 : 2;
}

module.exports = { runHauler };
