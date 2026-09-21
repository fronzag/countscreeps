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
    if (source) return source;
    const sources = room.find(FIND_SOURCES).sort((a, b) => a.id.localeCompare(b.id));
    const assignments = {};
    for (const item of sources) assignments[item.id] = 0;
    for (const other of room.find(FIND_MY_CREEPS)) {
        if (other.id !== creep.id && other.memory.role === "hauler" &&
            assignments[other.memory.sourceId] !== undefined) assignments[other.memory.sourceId]++;
    }
    sources.sort((a, b) => assignments[a.id] - assignments[b.id] || a.id.localeCompare(b.id));
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
    return creep.pos.findClosestByPath(controllerStores);
}

module.exports = { runHauler };
