const { safeMoveTo } = require("movement");
const { addMetric } = require("metrics");

function runMiner(creep, room) {
    const source = Game.getObjectById(creep.memory.sourceId);
    if (!source) return;
    const position = miningPosition(room, source);
    if (!creep.pos.isEqualTo(position)) {
        safeMoveTo(creep, position, { reusePath: 20 });
        return;
    }
    const amount = Math.min(source.energy, creep.getActiveBodyparts(WORK) * HARVEST_POWER);
    const result = creep.harvest(source);
    if (result === OK) addMetric("harvested", amount);
}

function miningPosition(room, source) {
    const plan = Memory.colony && Memory.colony.plans && Memory.colony.plans.sources[source.id];
    if (plan) return new RoomPosition(plan.x, plan.y, room.name);
    const path = room.findPath(source.pos, Game.spawns[Object.keys(Game.spawns)[0]].pos, {
        ignoreCreeps: true, swampCost: 2, maxRooms: 1
    });
    if (path.length) return new RoomPosition(path[0].x, path[0].y, room.name);
    return source.pos;
}

module.exports = { runMiner };
