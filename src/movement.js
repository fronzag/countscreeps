const CONFIG = require("config");

function safeMoveTo(creep, target, options) {
    if (!target) return ERR_INVALID_TARGET;
    const pos = target.pos || target;
    if (!pos || pos.roomName !== CONFIG.roomName) {
        console.log(`[BLOCK] ${creep.name}: movimento para fora de ${CONFIG.roomName}.`);
        return ERR_INVALID_TARGET;
    }

    return creep.moveTo(pos, Object.assign({ reusePath: 10, maxRooms: 1 }, options || {}));
}

function rescueBorderCreeps(room) {
    for (const creep of room.find(FIND_MY_CREEPS)) {
        if (creep.pos.x > 1 && creep.pos.x < 48 && creep.pos.y > 1 && creep.pos.y < 48) continue;
        creep.memory.borderRescue = Game.time;
        creep.say("BACK");
        safeMoveTo(creep, new RoomPosition(25, 25, room.name), { reusePath: 0 });
    }
}

module.exports = { safeMoveTo, rescueBorderCreeps };
