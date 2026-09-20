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
