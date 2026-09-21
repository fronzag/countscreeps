const CONFIG = require("config");

function planRoom(room, spawn) {
    const rcl = room.controller.level;
    if (rcl < 2) return;
    trimRoadBacklog(room);
    let allowance = CONFIG.maxConstructionSites - room.find(FIND_MY_CONSTRUCTION_SITES).length;
    if (allowance <= 0 && needsControllerContainer(room)) {
        const roadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: site => site.structureType === STRUCTURE_ROAD
        }).sort((a, b) => a.progress - b.progress);
        let removed = 0;
        while (allowance <= 0 && roadSites.length) {
            const site = roadSites.shift();
            if (site.remove() === OK) {
                allowance++;
                removed++;
            }
        }
        if (removed > 0) {
            console.log(`[PLANNER] ${removed} estrada(s) adiada(s) para priorizar container do controller`);
        }
    }
    if (allowance <= 0) return;

    allowance = planSourceContainers(room, spawn, allowance);
    if (allowance > 0) allowance = planControllerContainer(room, spawn, allowance);
    if (allowance > 0) {
        allowance = planNearSpawn(room, spawn, STRUCTURE_EXTENSION,
            CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][rcl] || 0, allowance);
    }
    if (rcl >= 3 && allowance > 0) {
        allowance = planNearSpawn(room, spawn, STRUCTURE_TOWER,
            CONTROLLER_STRUCTURES[STRUCTURE_TOWER][rcl] || 0, allowance);
    }
    if (allowance > 0 && canPlanRoads(room)) planRoads(room, spawn, allowance);
}

function trimRoadBacklog(room) {
    const allSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    const roadSites = allSites.filter(site => site.structureType === STRUCTURE_ROAD)
        .sort((a, b) => a.progress - b.progress);
    let total = allSites.length;
    while (roadSites.length > 0 &&
        (roadSites.length > CONFIG.maxRoadSites || total > CONFIG.maxConstructionSites)) {
        const site = roadSites.shift();
        if (site.remove() === OK) {
            total--;
            console.log(`[PLANNER] estrada ${site.pos.x},${site.pos.y} removida do backlog`);
        }
    }
}

function canPlanRoads(room) {
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    const essential = sites.some(site => site.structureType !== STRUCTURE_ROAD &&
        site.structureType !== STRUCTURE_WALL && site.structureType !== STRUCTURE_RAMPART);
    if (essential) return false;
    const dropped = room.find(FIND_DROPPED_RESOURCES, {
        filter: resource => resource.resourceType === RESOURCE_ENERGY
    }).reduce((sum, resource) => sum + resource.amount, 0);
    return dropped < 500;
}

function planSourceContainers(room, spawn, allowance) {
    for (const source of room.find(FIND_SOURCES)) {
        let plan = Memory.colony.plans.sources[source.id];
        if (!plan) {
            const path = room.findPath(source.pos, spawn.pos, { ignoreCreeps: true, swampCost: 2, maxRooms: 1 });
            if (!path.length) continue;
            plan = { x: path[0].x, y: path[0].y };
            Memory.colony.plans.sources[source.id] = plan;
        }
        if (!hasStructureOrSite(room, plan.x, plan.y, STRUCTURE_CONTAINER)) {
            if (room.createConstructionSite(plan.x, plan.y, STRUCTURE_CONTAINER) === OK) {
                allowance--;
                console.log(`[PLANNER] container da fonte ${source.id} em ${plan.x},${plan.y}`);
            }
        }
        if (allowance <= 0) return allowance;
    }
    return allowance;
}

function planControllerContainer(room, spawn, allowance) {
    let plan = Memory.colony.plans.controller;
    if (!plan) {
        const path = room.findPath(room.controller.pos, spawn.pos, { ignoreCreeps: true, swampCost: 2, maxRooms: 1 });
        if (path.length < 3) return allowance;
        plan = { x: path[2].x, y: path[2].y };
        Memory.colony.plans.controller = plan;
    }
    if (!hasStructureOrSite(room, plan.x, plan.y, STRUCTURE_CONTAINER) &&
        room.createConstructionSite(plan.x, plan.y, STRUCTURE_CONTAINER) === OK) {
        allowance--;
        console.log(`[PLANNER] container do controller em ${plan.x},${plan.y}`);
    }
    return allowance;
}

function needsControllerContainer(room) {
    const controller = room.controller;
    if (!controller) return false;
    const nearbyBuilt = controller.pos.findInRange(FIND_STRUCTURES, 4, {
        filter: s => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE
    });
    const nearbySites = controller.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 4, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    return nearbyBuilt.length + nearbySites.length === 0;
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
    const existingRoadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: site => site.structureType === STRUCTURE_ROAD
    }).length;
    allowance = Math.min(allowance, Math.max(0, CONFIG.maxRoadSites - existingRoadSites));
    if (allowance <= 0) return;
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

function hasStructureOrSite(room, x, y, type) {
    return room.lookForAt(LOOK_STRUCTURES, x, y).some(s => s.structureType === type) ||
        room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).some(s => s.structureType === type);
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
