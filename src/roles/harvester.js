const { getEnergy, upgradeController } = require("creepActions");
const { safeMoveTo } = require("movement");

function runHarvester(creep, room) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return getEnergy(creep, room);

    const targets = room.find(FIND_MY_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_SPAWN ||
            s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_TOWER) &&
            s.store && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    targets.sort((a, b) => structurePriority(a) - structurePriority(b));
    const priority = targets.length ? structurePriority(targets[0]) : null;
    const target = creep.pos.findClosestByPath(targets.filter(s => structurePriority(s) === priority));
    if (target) {
        const result = creep.transfer(target, RESOURCE_ENERGY);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, target);
        return;
    }
    upgradeController(creep, room);
}

function structurePriority(structure) {
    if (structure.structureType === STRUCTURE_SPAWN) return 1;
    if (structure.structureType === STRUCTURE_EXTENSION) return 2;
    return 3;
}

module.exports = { runHarvester };
