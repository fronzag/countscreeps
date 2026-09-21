module.exports = {
    roomName: "E13S7",
    spawnName: "Spawn1",

    population: {
        1: { miner: 0, hauler: 0, harvester: 2, upgrader: 2, builder: 0 },
        2: { miner: 2, hauler: 2, harvester: 0, upgrader: 3, builder: 2 },
        3: { miner: 2, hauler: 2, harvester: 0, upgrader: 3, builder: 2 },
        4: { miner: 2, hauler: 3, harvester: 0, upgrader: 3, builder: 2 }
    },

    plannerInterval: 25,
    telemetryInterval: 5,
    statusInterval: 25,
    maxConstructionSites: 6,
    maxRoadSites: 2,
    replacementLeadTicks: 80,
    repairWallLimit: 10000
};
