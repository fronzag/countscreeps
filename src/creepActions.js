const { safeMoveTo } = require("movement");
const { addMetric } = require("metrics");

function chooseSource(creep, room) {
    const sources = room.find(FIND_SOURCES);
    if (!sources.length) return null;
    if (!creep.memory.sourceId || !Game.getObjectById(creep.memory.sourceId)) {
        creep.memory.sourceId = sources[hashName(creep.name) % sources.length].id;
    }
    return Game.getObjectById(creep.memory.sourceId);
}

function getEnergy(creep, room) {
    const stores = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
            s.store && s.store[RESOURCE_ENERGY] >= Math.min(50, creep.store.getFreeCapacity(RESOURCE_ENERGY))
    });
    const store = creep.pos.findClosestByPath(stores);
    if (store) {
        const amount = Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), store.store[RESOURCE_ENERGY]);
        const result = creep.withdraw(store, RESOURCE_ENERGY);
        if (result === OK) addMetric("withdrawn", amount);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, store);
        return result;
    }

    const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: r => r.resourceType === RESOURCE_ENERGY && r.amount >= 25
    });
    if (dropped) {
        const amount = Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), dropped.amount);
        const result = creep.pickup(dropped);
        if (result === OK) addMetric("pickedUp", amount);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, dropped);
        return result;
    }

    const source = chooseSource(creep, room);
    if (!source) return ERR_NOT_FOUND;
    const amount = Math.min(source.energy, creep.getActiveBodyparts(WORK) * HARVEST_POWER,
        creep.store.getFreeCapacity(RESOURCE_ENERGY));
    const result = creep.harvest(source);
    if (result === OK) addMetric("harvested", amount);
    if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, source);
    return result;
}

function upgradeController(creep, room) {
    if (!room.controller || !room.controller.my) return ERR_INVALID_TARGET;
    const amount = Math.min(creep.store[RESOURCE_ENERGY], creep.getActiveBodyparts(WORK) * UPGRADE_CONTROLLER_POWER);
    const result = creep.upgradeController(room.controller);
    if (result === OK) addMetric("upgraded", amount);
    if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, room.controller);
    return result;
}

function transferEnergy(creep, target) {
    const amount = Math.min(creep.store[RESOURCE_ENERGY], target.store.getFreeCapacity(RESOURCE_ENERGY));
    const result = creep.transfer(target, RESOURCE_ENERGY);
    if (result === OK) addMetric("delivered", amount);
    if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, target);
    return result;
}

function updateWorkingState(creep) {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) creep.memory.working = false;
    if (!creep.memory.working && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) creep.memory.working = true;
}

function hashName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    return Math.abs(hash);
}

module.exports = { chooseSource, getEnergy, upgradeController, transferEnergy, updateWorkingState };
