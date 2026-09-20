// ============================================================
// HARVESTER
// ============================================================

const {
    harvestEnergy,
    upgradeController
} = require("creepActions");

function runHarvester(
    creep,
    room
) {

    // --------------------------------------------------------
    // COLETAR
    // --------------------------------------------------------

    if (
        creep.store.getFreeCapacity(
            RESOURCE_ENERGY
        ) > 0
    ) {

        harvestEnergy(
            creep,
            room
        );

        return;
    }


    // --------------------------------------------------------
    // ENTREGAR ENERGIA
    // --------------------------------------------------------

    const targets =
        room.find(

            FIND_MY_STRUCTURES,

            {
                filter:
                    structure =>

                        (

                            structure.structureType ===
                            STRUCTURE_SPAWN

                            ||

                            structure.structureType ===
                            STRUCTURE_EXTENSION

                            ||

                            structure.structureType ===
                            STRUCTURE_TOWER

                        )

                        &&

                        structure.store

                        &&

                        structure.store.getFreeCapacity(
                            RESOURCE_ENERGY
                        ) > 0
            }
        );


    const target =
        creep.pos.findClosestByPath(
            targets
        );


    if (target) {

        const result =
            creep.transfer(

                target,

                RESOURCE_ENERGY
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


    // --------------------------------------------------------
    // Spawn cheio:
    // energia excedente vai para Controller.
    // --------------------------------------------------------

    upgradeController(
        creep,
        room
    );
}

module.exports = { runHarvester };
