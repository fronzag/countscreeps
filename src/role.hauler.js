const { safeMoveTo } = require("movement");
const { transferEnergy } = require("creepActions");
const { addMetric } = require("metrics");

function runHauler(creep, room) {
    if (creep.store[RESOURCE_ENERGY] === 0) creep.memory.delivering = false;
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) creep.memory.delivering = true;

    if (!creep.memory.delivering) return collect(creep, room);
    const target = deliveryTarget(creep, room);
    if (target) transferEnergy(creep, target);
}

function collect(creep, room) {
    const containers = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0 &&
            (!room.controller || s.pos.getRangeTo(room.controller) > 4)
    });
    containers.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
    let target = containers.length ? containers[0] : null;
    const dropped = room.find(FIND_DROPPED_RESOURCES, {
        filter: r => r.resourceType === RESOURCE_ENERGY && r.amount >= 25
    }).sort((a, b) => b.amount - a.amount)[0];
    if (dropped && (!target || dropped.amount > target.store[RESOURCE_ENERGY])) target = dropped;
    if (!target) return;

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
