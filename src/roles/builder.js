const { getEnergy, upgradeController, updateWorkingState } = require("creepActions");
const { safeMoveTo } = require("movement");

const PRIORITY = {
    spawn: 1, extension: 2, tower: 3, container: 4, road: 5, rampart: 6, wall: 7
};

function runBuilder(creep, room) {
    updateWorkingState(creep);
    if (!creep.memory.working) return getEnergy(creep, room);

    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    sites.sort((a, b) => (PRIORITY[a.structureType] || 99) - (PRIORITY[b.structureType] || 99));
    const bestPriority = sites.length ? (PRIORITY[sites[0].structureType] || 99) : null;
    const candidates = sites.filter(s => (PRIORITY[s.structureType] || 99) === bestPriority);
    const target = creep.pos.findClosestByPath(candidates);
    if (target) {
        const result = creep.build(target);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, target);
        return;
    }

    const damaged = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) &&
            s.hits < s.hitsMax * 0.6
    });
    if (damaged) {
        const result = creep.repair(damaged);
        if (result === ERR_NOT_IN_RANGE) safeMoveTo(creep, damaged);
        return;
    }
    upgradeController(creep, room);
}

module.exports = { runBuilder };
