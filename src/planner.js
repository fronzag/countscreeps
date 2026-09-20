const CONFIG = require("config");

function planRoom(room, spawn) {
    const rcl = room.controller.level;
    if (rcl < 2) return;
    let allowance = CONFIG.maxConstructionSites - room.find(FIND_MY_CONSTRUCTION_SITES).length;
    if (allowance <= 0) return;

    allowance = planNearSpawn(room, spawn, STRUCTURE_EXTENSION,
        CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][rcl] || 0, allowance);
    if (rcl >= 3 && allowance > 0) {
        allowance = planNearSpawn(room, spawn, STRUCTURE_TOWER,
            CONTROLLER_STRUCTURES[STRUCTURE_TOWER][rcl] || 0, allowance);
    }
    if (allowance > 0) planRoads(room, spawn, allowance);
}

function planNearSpawn(room, spawn, type, desired, allowance) {
    let missing = Math.min(desired - countType(room, type), allowance);
    if (missing <= 0) return allowance;
    for (let radius = 2; radius <= 7 && missing > 0; radius++) {
        for (let dx = -radius; dx <= radius && missing > 0; dx++) {
            for (let dy = -radius; dy <= radius && missing > 0; dy++) {
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                const x = spawn.pos.x + dx;
                const y = spawn.pos.y + dy;
                if (!isBuildable(room, x, y)) continue;
                if (room.createConstructionSite(x, y, type) === OK) {
                    missing--; allowance--;
                    console.log(`[PLANNER] ${type} em ${x},${y}`);
                }
            }
        }
    }
    return allowance;
}

function planRoads(room, spawn, allowance) {
    const targets = room.find(FIND_SOURCES).concat(room.controller);
    for (const target of targets) {
        const path = room.findPath(spawn.pos, target.pos, { ignoreCreeps: true, swampCost: 2, maxRooms: 1 });
        for (let i = 0; i < path.length - 1 && allowance > 0; i++) {
            const step = path[i];
            const hasRoad = room.lookForAt(LOOK_STRUCTURES, step.x, step.y)
                .some(s => s.structureType === STRUCTURE_ROAD);
            if (hasRoad || room.lookForAt(LOOK_CONSTRUCTION_SITES, step.x, step.y).length) continue;
            if (room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD) === OK) allowance--;
        }
        if (allowance <= 0) return;
    }
}

function countType(room, type) {
    return room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === type }).length +
        room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === type }).length;
}

function isBuildable(room, x, y) {
    if (x <= 2 || x >= 47 || y <= 2 || y >= 47) return false;
    if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) return false;
    if (room.lookForAt(LOOK_STRUCTURES, x, y).length) return false;
    return room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length === 0;
}

module.exports = { planRoom };
