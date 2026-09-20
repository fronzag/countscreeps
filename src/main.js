// ============================================================
// SCREEPS - COLONY OS v3.2
// SINGLE ROOM - ESTÁVEL
//
// Objetivo:
// - Operar somente a nossa room
// - Não navegar entre rooms
// - Harvesters mantêm energia
// - Upgraders evoluem Controller
// - Builders constroem
// - Planejamento automático a partir do RCL 2
// ============================================================

const CONFIG = require("config");
const { cleanMemory } = require("memory");
const { planRoom } = require("planner");
const { runSpawnManager } = require("spawnManager");
const { runHarvester } = require("roles/harvester");
const { runUpgrader } = require("roles/upgrader");
const { runBuilder } = require("roles/builder");
const { printStatus } = require("status");

// ============================================================
// MAIN
// ============================================================

module.exports.loop = function () {

    cleanMemory();

    const spawn =
        Game.spawns["Spawn1"];


    if (!spawn) {

        console.log(
            "[ERROR] Spawn1 não encontrado."
        );

        return;
    }


    const room =
        spawn.room;


    // Segurança:
    // nunca operar uma room cujo controller não seja nosso.

    if (
        !room.controller ||
        !room.controller.my
    ) {

        console.log(
            `[ERROR] Controller de ${room.name} não pertence a nós.`
        );

        return;
    }


    // --------------------------------------------------------
    // PLANNER
    // --------------------------------------------------------

    if (
        Game.time %
        CONFIG.plannerInterval ===
        0
    ) {

        planRoom(
            room,
            spawn
        );
    }


    // --------------------------------------------------------
    // SPAWN
    // --------------------------------------------------------

    runSpawnManager(
        spawn,
        room
    );


    // --------------------------------------------------------
    // CREEPS
    //
    // IMPORTANTE:
    // Só controlamos creeps que estão NA NOSSA ROOM.
    //
    // Nenhum código aqui manda creep para outra room.
    // --------------------------------------------------------

    for (
        const name in Game.creeps
    ) {

        const creep =
            Game.creeps[name];


        if (
            creep.room.name !==
            room.name
        ) {

            continue;
        }


        switch (
            creep.memory.role
        ) {

            case "harvester":

                runHarvester(
                    creep,
                    room
                );

                break;


            case "upgrader":

                runUpgrader(
                    creep,
                    room
                );

                break;


            case "builder":

                runBuilder(
                    creep,
                    room
                );

                break;
        }
    }


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (
        Game.time %
        CONFIG.statusInterval ===
        0
    ) {

        printStatus(
            room
        );
    }
};
