function cleanMemory() {
    if (!Memory.creeps) Memory.creeps = {};
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }
    if (!Memory.colony) Memory.colony = { version: 4 };
}

module.exports = { cleanMemory };
