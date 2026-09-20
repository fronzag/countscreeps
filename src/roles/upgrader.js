// ============================================================
// UPGRADER
// ============================================================

const {
    harvestEnergy,
    upgradeController,
    updateWorkingState
} = require("creepActions");

function runUpgrader(
    creep,
    room
) {

    updateWorkingState(
        creep
    );


    if (
        !creep.memory.working
    ) {

        harvestEnergy(
            creep,
            room
        );

        return;
    }


    upgradeController(
        creep,
        room
    );
}

module.exports = { runUpgrader };
