const CONFIG = require("config");

function runTowers(room) {
    const towers = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_TOWER
    });
    if (!towers.length) return;

    const hostile = room.find(FIND_HOSTILE_CREEPS)[0];
    const injured = room.find(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax })[0];
    const repair = room.find(FIND_STRUCTURES, {
        filter: s => s.hits < s.hitsMax * 0.5 &&
            ((s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART) ||
             s.hits < CONFIG.repairWallLimit)
    }).sort((a, b) => a.hits - b.hits)[0];

    for (const tower of towers) {
        if (hostile) tower.attack(hostile);
        else if (injured) tower.heal(injured);
        else if (tower.store[RESOURCE_ENERGY] > 500 && repair) tower.repair(repair);
    }
}

module.exports = { runTowers };
