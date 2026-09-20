// ============================================================
// CREEP ACTIONS
// ============================================================

function harvestEnergy(
    creep,
    room
) {

    const sources =
        room.find(
            FIND_SOURCES_ACTIVE
        );


    if (
        sources.length === 0
    ) {

        return;
    }


    const source =
        creep.pos.findClosestByPath(
            sources
        );


    if (!source) {

        return;
    }


    const result =
        creep.harvest(
            source
        );


    if (
        result ===
        ERR_NOT_IN_RANGE
    ) {

        creep.moveTo(
            source,
            {
                reusePath: 10
            }
        );
    }
}


function upgradeController(
    creep,
    room
) {

    const controller =
        room.controller;


    // Segurança:
    // Controller precisa ser nosso.

    if (
        !controller ||
        !controller.my
    ) {

        return;
    }


    const result =
        creep.upgradeController(
            controller
        );


    if (
        result ===
        ERR_NOT_IN_RANGE
    ) {

        creep.moveTo(
            controller,
            {
                reusePath: 10
            }
        );
    }
}


function updateWorkingState(
    creep
) {

    if (
        creep.memory.working &&
        creep.store[
            RESOURCE_ENERGY
        ] === 0
    ) {

        creep.memory.working =
            false;
    }


    if (
        !creep.memory.working &&
        creep.store.getFreeCapacity(
            RESOURCE_ENERGY
        ) === 0
    ) {

        creep.memory.working =
            true;
    }
}

module.exports = {
    harvestEnergy,
    upgradeController,
    updateWorkingState
};
