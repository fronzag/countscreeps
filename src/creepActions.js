const { safeMoveTo } = require("movement");

function chooseSource(creep, room) {
    const sources = room.find(FIND_SOURCES);
    if (!sources.length) return null;
    if (!creep.memory.sourceId || !Game.getObjectById(creep.memory.sourceId)) {
        const index = hashName(creep.name) % sources.length;
        creep.memory.sourceId = sources[index].id;
    }
    return Game.getObjectById(creep.memory.sourceId);
}

function getEnergy(creep, room) {
    const nearby = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: r => r.resourceType === RESOURCE_ENERGY && r.amount >= 25
    });
    if (nearby) {
        const result = creep.pickup(nearby);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, nearby);
        return result;
    }

    const stores = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
            s.store && s.store[RESOURCE_ENERGY] > 100
    });
    const store = creep.pos.findClosestByPath(stores);
    if (store) {
        const result = creep.withdraw(store, RESOURCE_ENERGY);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, store);
        return result;
    }

    const source = chooseSource(creep, room);
    if (!source) return ERR_NOT_FOUND;
    const result = creep.harvest(source);
    if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, source);
    return result;
}

function upgradeController(creep, room) {
    if (!room.controller || !room.controller.my) return ERR_INVALID_TARGET;
    const result = creep.upgradeController(room.controller);
    if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, room.controller);
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

module.exports = { getEnergy, upgradeController, updateWorkingState };
