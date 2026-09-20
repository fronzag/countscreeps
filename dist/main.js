'use strict';

var __modules = {};
var __cache = {};

function __require(id) {
    if (__cache[id]) return __cache[id];
    var module = { exports: {} };
    __cache[id] = module.exports;
    __modules[id](module, module.exports, __require);
    return module.exports;
}

__modules['./config.js'] = function (module, exports, require) {
    // ============================================================
    // CONFIG
    // ============================================================
    
    module.exports = {
    
        population: {
    
            1: {
                harvester: 2,
                upgrader: 3,
                builder: 0
            },
    
            2: {
                harvester: 3,
                upgrader: 2,
                builder: 2
            },
    
            3: {
                harvester: 3,
                upgrader: 2,
                builder: 2
            }
        },
    
        plannerInterval: 25,
    
        statusInterval: 25
    };
};

__modules['./memory.js'] = function (module, exports, require) {
    // ============================================================
    // MEMORY CLEANER
    // ============================================================
    
    function cleanMemory() {
    
        if (
            !Memory.creeps
        ) {
    
            Memory.creeps = {};
        }
    
    
        for (
            const name in Memory.creeps
        ) {
    
            if (
                !Game.creeps[name]
            ) {
    
                delete Memory.creeps[name];
            }
        }
    }
    
    module.exports = { cleanMemory };
};

__modules['./planner.js'] = function (module, exports, require) {
    // ============================================================
    // ROOM PLANNER
    // ============================================================
    
    function planRoom(
        room,
        spawn
    ) {
    
        const rcl =
            room.controller.level;
    
    
        // --------------------------------------------------------
        // RCL 1
        //
        // NÃO CONSTRUÍMOS NADA.
        //
        // Só:
        // source -> spawn -> controller
        // --------------------------------------------------------
    
        if (
            rcl < 2
        ) {
    
            return;
        }
    
    
        // --------------------------------------------------------
        // RCL 2
        // --------------------------------------------------------
    
        planExtensions(
            room,
            spawn,
            5
        );
    
    
        planRoads(
            room,
            spawn
        );
    
    
        // --------------------------------------------------------
        // RCL 3
        // --------------------------------------------------------
    
        if (
            rcl >= 3
        ) {
    
            planExtensions(
                room,
                spawn,
                10
            );
    
    
            planTower(
                room,
                spawn
            );
        }
    }
    
    
    function planExtensions(
        room,
        spawn,
        desired
    ) {
    
        const existing =
            room.find(
    
                FIND_MY_STRUCTURES,
    
                {
                    filter:
                        structure =>
                            structure.structureType ===
                            STRUCTURE_EXTENSION
                }
    
            ).length;
    
    
        const sites =
            room.find(
    
                FIND_MY_CONSTRUCTION_SITES,
    
                {
                    filter:
                        site =>
                            site.structureType ===
                            STRUCTURE_EXTENSION
                }
    
            ).length;
    
    
        let missing =
    
            desired
            -
            existing
            -
            sites;
    
    
        if (
            missing <= 0
        ) {
    
            return;
        }
    
    
        for (
            let radius = 2;
            radius <= 6;
            radius++
        ) {
    
            for (
                let dx = -radius;
                dx <= radius;
                dx++
            ) {
    
                for (
                    let dy = -radius;
                    dy <= radius;
                    dy++
                ) {
    
                    if (
                        missing <= 0
                    ) {
    
                        return;
                    }
    
    
                    // Só borda do quadrado.
    
                    if (
                        Math.abs(dx) !== radius &&
                        Math.abs(dy) !== radius
                    ) {
    
                        continue;
                    }
    
    
                    const x =
                        spawn.pos.x +
                        dx;
    
    
                    const y =
                        spawn.pos.y +
                        dy;
    
    
                    if (
                        !isBuildable(
                            room,
                            x,
                            y
                        )
                    ) {
    
                        continue;
                    }
    
    
                    const result =
                        room.createConstructionSite(
    
                            x,
                            y,
    
                            STRUCTURE_EXTENSION
                        );
    
    
                    if (
                        result === OK
                    ) {
    
                        console.log(
                            `[PLANNER] Extension ${x},${y}`
                        );
    
    
                        missing--;
                    }
                }
            }
        }
    }
    
    
    function planRoads(
        room,
        spawn
    ) {
    
        const targets =
            room.find(
                FIND_SOURCES
            );
    
    
        targets.push(
            room.controller
        );
    
    
        for (
            const target of targets
        ) {
    
            const path =
                room.findPath(
    
                    spawn.pos,
    
                    target.pos,
    
                    {
                        ignoreCreeps:
                            true,
    
                        swampCost:
                            2
                    }
                );
    
    
            for (
                let i = 0;
                i < path.length - 1;
                i++
            ) {
    
                const step =
                    path[i];
    
    
                const structures =
                    room.lookForAt(
    
                        LOOK_STRUCTURES,
    
                        step.x,
                        step.y
                    );
    
    
                if (
                    structures.some(
                        structure =>
                            structure.structureType ===
                            STRUCTURE_ROAD
                    )
                ) {
    
                    continue;
                }
    
    
                const sites =
                    room.lookForAt(
    
                        LOOK_CONSTRUCTION_SITES,
    
                        step.x,
                        step.y
                    );
    
    
                if (
                    sites.length > 0
                ) {
    
                    continue;
                }
    
    
                room.createConstructionSite(
    
                    step.x,
                    step.y,
    
                    STRUCTURE_ROAD
                );
            }
        }
    }
    
    
    function planTower(
        room,
        spawn
    ) {
    
        const existing =
            room.find(
    
                FIND_MY_STRUCTURES,
    
                {
                    filter:
                        structure =>
                            structure.structureType ===
                            STRUCTURE_TOWER
                }
    
            ).length;
    
    
        const sites =
            room.find(
    
                FIND_MY_CONSTRUCTION_SITES,
    
                {
                    filter:
                        site =>
                            site.structureType ===
                            STRUCTURE_TOWER
                }
    
            ).length;
    
    
        if (
            existing +
            sites >
            0
        ) {
    
            return;
        }
    
    
        for (
            let radius = 2;
            radius <= 5;
            radius++
        ) {
    
            for (
                let dx = -radius;
                dx <= radius;
                dx++
            ) {
    
                for (
                    let dy = -radius;
                    dy <= radius;
                    dy++
                ) {
    
                    const x =
                        spawn.pos.x +
                        dx;
    
    
                    const y =
                        spawn.pos.y +
                        dy;
    
    
                    if (
                        !isBuildable(
                            room,
                            x,
                            y
                        )
                    ) {
    
                        continue;
                    }
    
    
                    const result =
                        room.createConstructionSite(
    
                            x,
                            y,
    
                            STRUCTURE_TOWER
                        );
    
    
                    if (
                        result === OK
                    ) {
    
                        console.log(
                            `[PLANNER] Tower ${x},${y}`
                        );
    
    
                        return;
                    }
                }
            }
        }
    }
    
    
    function isBuildable(
        room,
        x,
        y
    ) {
    
        // Evita bordas.
        // Nosso bot NÃO tem motivo para construir nelas.
    
        if (
            x <= 2 ||
            x >= 47 ||
            y <= 2 ||
            y >= 47
        ) {
    
            return false;
        }
    
    
        const terrain =
            room.getTerrain();
    
    
        if (
            terrain.get(
                x,
                y
            ) ===
            TERRAIN_MASK_WALL
        ) {
    
            return false;
        }
    
    
        const structures =
            room.lookForAt(
    
                LOOK_STRUCTURES,
    
                x,
                y
            );
    
    
        if (
            structures.length > 0
        ) {
    
            return false;
        }
    
    
        const sites =
            room.lookForAt(
    
                LOOK_CONSTRUCTION_SITES,
    
                x,
                y
            );
    
    
        if (
            sites.length > 0
        ) {
    
            return false;
        }
    
    
        return true;
    }
    
    module.exports = { planRoom };
};

__modules['./spawnManager.js'] = function (module, exports, require) {
    // ============================================================
    // SPAWN MANAGER
    // ============================================================
    
    const CONFIG = require("./config");
    
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
};

__modules['./creepActions.js'] = function (module, exports, require) {
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
};

__modules['./roles/harvester.js'] = function (module, exports, require) {
    // ============================================================
    // HARVESTER
    // ============================================================
    
    const {
        harvestEnergy,
        upgradeController
    } = require("../creepActions");
    
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
};

__modules['./roles/upgrader.js'] = function (module, exports, require) {
    // ============================================================
    // UPGRADER
    // ============================================================
    
    const {
        harvestEnergy,
        upgradeController,
        updateWorkingState
    } = require("../creepActions");
    
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
};

__modules['./roles/builder.js'] = function (module, exports, require) {
    // ============================================================
    // BUILDER
    // ============================================================
    
    const {
        harvestEnergy,
        upgradeController,
        updateWorkingState
    } = require("../creepActions");
    
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
};

__modules['./status.js'] = function (module, exports, require) {
    // ============================================================
    // STATUS
    // ============================================================
    
    const { countRolesInRoom } = require("./spawnManager");
    
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
};

__modules['./main.js'] = function (module, exports, require) {
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
    
    const CONFIG = require("./config");
    const { cleanMemory } = require("./memory");
    const { planRoom } = require("./planner");
    const { runSpawnManager } = require("./spawnManager");
    const { runHarvester } = require("./roles/harvester");
    const { runUpgrader } = require("./roles/upgrader");
    const { runBuilder } = require("./roles/builder");
    const { printStatus } = require("./status");
    
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
};

module.exports = __require('./main.js');