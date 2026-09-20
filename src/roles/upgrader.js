const { getEnergy, upgradeController, updateWorkingState } = require("creepActions");

function runUpgrader(creep, room) {
    updateWorkingState(creep);
    if (!creep.memory.working) getEnergy(creep, room);
    else upgradeController(creep, room);
}

module.exports = { runUpgrader };
