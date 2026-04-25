function createLoggingService(io, state) {
    function addLog(msg) {
        console.log(msg);
        state.currentLog.push({ time: new Date().toLocaleTimeString(), msg });
        io.emit('log', state.currentLog);
    }

    function resetLogs() {
        state.currentLog = [];
    }

    return {
        addLog,
        resetLogs
    };
}

module.exports = { createLoggingService };
