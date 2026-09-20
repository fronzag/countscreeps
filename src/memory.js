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
