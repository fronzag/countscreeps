function ensureMetrics() {
    if (!Memory.colony) Memory.colony = { version: 5 };
    if (!Memory.colony.metrics) {
        Memory.colony.metrics = {
            since: Game.time,
            harvested: 0,
            pickedUp: 0,
            withdrawn: 0,
            delivered: 0,
            built: 0,
            upgraded: 0,
            harvestPaused: 0
        };
    }
    return Memory.colony.metrics;
}

function addMetric(name, amount) {
    if (amount > 0) ensureMetrics()[name] = (ensureMetrics()[name] || 0) + amount;
}

module.exports = { ensureMetrics, addMetric };
