const { ensureMetrics } = require("metrics");

function cleanMemory() {
    if (!Memory.creeps) Memory.creeps = {};
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }
    if (!Memory.colony) Memory.colony = { version: 5 };
    Memory.colony.version = 5;
    if (!Memory.colony.plans) Memory.colony.plans = { sources: {}, controller: null };
    ensureMetrics();
}

module.exports = { cleanMemory };
