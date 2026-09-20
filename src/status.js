// ============================================================
// STATUS
// ============================================================

const { countRolesInRoom } = require("spawnManager");

function printStatus(room) {

    const counts =
        countRolesInRoom(
            room
        );


    const controller =
        room.controller;


    console.log(
        "============================"
    );


    console.log(
        `COLONY STATUS - ${room.name}`
    );


    console.log(
        `RCL: ${controller.level}`
    );


    console.log(
        `RCL Progress: ${controller.progress}/${controller.progressTotal}`
    );


    console.log(
        `Downgrade: ${controller.ticksToDowngrade}`
    );


    console.log(
        `Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`
    );


    console.log(
        `Harvesters: ${counts.harvester}`
    );


    console.log(
        `Upgraders: ${counts.upgrader}`
    );


    console.log(
        `Builders: ${counts.builder}`
    );


    console.log(
        "============================"
    );
}

module.exports = { printStatus };
