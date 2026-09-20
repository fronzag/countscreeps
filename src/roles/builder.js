// ============================================================
// BUILDER
// ============================================================

const {
    harvestEnergy,
    upgradeController,
    updateWorkingState
} = require("creepActions");

function runBuilder(
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


    const sites =
        room.find(
            FIND_MY_CONSTRUCTION_SITES
        );


    if (
        sites.length > 0
    ) {

        const target =
            creep.pos.findClosestByPath(
                sites
            );


        if (target) {

            const result =
                creep.build(
                    target
                );


            if (
                result ===
                ERR_NOT_IN_RANGE
            ) {

                creep.moveTo(
                    target,
                    {
                        reusePath: 10
                    }
                );
            }


            return;
        }
    }


    // Sem construção:
    // vira upgrader temporariamente.

    upgradeController(
        creep,
        room
    );
}

module.exports = { runBuilder };
