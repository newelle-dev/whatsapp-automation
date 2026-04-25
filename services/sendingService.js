function sleep(min = 15000, max = 45000) {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function startSendingFlow({ state, io, addLog, buildMessageForItem }) {
    (async () => {
        for (let i = 0; i < state.sendingQueue.length; i++) {
            const item = state.sendingQueue[i];
            try {
                const messageText = buildMessageForItem(item);
                addLog(`[${i + 1}/${state.sendingQueue.length}] Sending to ${item.name} (${item.phone})...`);

                await state.whatsappClient.sendMessage(item.phone, messageText);

                addLog(`Success! Messages sent: ${i + 1}/${state.sendingQueue.length}`);
            } catch (error) {
                addLog(`ERROR: Failed to send to ${item.name} (${item.phone}) - ${error.message}`);
                state.manualReviewQueue.push({ ...item, reason: 'API Error', error: error.message });
            } finally {
                io.emit('progress', { current: i + 1, total: state.sendingQueue.length });

                if (i < state.sendingQueue.length - 1) {
                    addLog('Waiting randomized delay (15s - 45s) to avoid spam flags...');
                    await sleep(15000, 45000);
                }
            }
        }

        state.isSending = false;
        addLog('=== FINISHED SENDING ===');
        io.emit('completed', state.manualReviewQueue);
    })();
}

module.exports = {
    sleep,
    startSendingFlow
};
