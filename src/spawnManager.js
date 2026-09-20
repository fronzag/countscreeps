// ============================================================
// SPAWN MANAGER
// ============================================================

const CONFIG = require("config");

function runSpawnManager(
    spawn,
    room
) {

    if (
        spawn.spawning
    ) {

        return;
    }


    const rcl =
        room.controller.level;


    const config =
        CONFIG.population[rcl] ||
        CONFIG.population[3];


    const counts =
        countRolesInRoom(
            room
        );


    let role = null;


    // --------------------------------------------------------
    // Prioridade:
    //
    // 1. Harvester
    // 2. Upgrader
    // 3. Builder
    // --------------------------------------------------------

    if (
        counts.harvester <
        config.harvester
    ) {

        role =
            "harvester";
    }

    else if (
        counts.upgrader <
        config.upgrader
    ) {

        role =
            "upgrader";
    }

    else if (
        counts.builder <
        config.builder
    ) {

        role =
            "builder";
    }


    if (!role) {

        return;
    }


    const body =
        getBody(
            room,
            role
        );


    const cost =
        getBodyCost(
            body
        );


    if (
        room.energyAvailable <
        cost
    ) {

        return;
    }


    const name =
        `${role}-${Game.time}`;


    const result =
        spawn.spawnCreep(

            body,

            name,

            {
                memory: {

                    role:
                        role,

                    working:
                        false
                }
            }
        );


    if (
        result === OK
    ) {

        console.log(
            `[SPAWN] ${name}`
        );
    }
}


function getBody(
    room,
    role
) {

    const energy =
        room.energyAvailable;


    // RCL1 normalmente terá 300.

    if (
        energy >= 400
    ) {

        if (
            role ===
            "harvester"
        ) {

            return [

                WORK,
                WORK,

                CARRY,
                CARRY,

                MOVE,
                MOVE
            ];
        }


        return [

            WORK,

            CARRY,
            CARRY,

            MOVE,
            MOVE,
            MOVE
        ];
    }


    return [

        WORK,
        CARRY,
        MOVE
    ];
}


function getBodyCost(body) {

    return body.reduce(

        (total, part) =>

            total +
            BODYPART_COST[part],

        0
    );
}


function countRolesInRoom(
    room
) {

    const counts = {

        harvester: 0,

        upgrader: 0,

        builder: 0
    };


    const creeps =
        room.find(
            FIND_MY_CREEPS
        );


    for (
        const creep of creeps
    ) {

        const role =
            creep.memory.role;


        if (
            counts[role] !==
            undefined
        ) {

            counts[role]++;
        }
    }


    return counts;
}

module.exports = {
    runSpawnManager,
    countRolesInRoom
};
