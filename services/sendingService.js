function sleep(min = 15000, max = 45000) {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function startSendingFlow({ state, io, addLog, buildMessageForItem }) {
    (async () => {
        const results = [];

        for (let i = 0; i < state.sendingQueue.length; i++) {
            const item = state.sendingQueue[i];
            const timestamp = new Date().toISOString();
            try {
                const messageText = buildMessageForItem(item);
                addLog(`[${i + 1}/${state.sendingQueue.length}] Sending to ${item.name} (${item.phone})...`);

                const sendResult = await state.whatsappClient.sendMessage(item.phone, messageText);
                const nextResult = {
                    ...item,
                    name: item.name,
                    phone: item.phone,
                    message: messageText,
                    status: 'sent',
                    error: '',
                    timestamp,
                    messageId: sendResult?.id?._serialized || sendResult?.id || sendResult?.messageId || ''
                };

                results.push(nextResult);
                state.sendResults = results;
                state.sendSummary = {
                    total: state.sendingQueue.length,
                    sent: results.filter((result) => result.status === 'sent').length,
                    failed: results.filter((result) => result.status === 'failed').length
                };
                io.emit('recipient-status', nextResult);

                addLog(`Success! Messages sent: ${i + 1}/${state.sendingQueue.length}`);
            } catch (error) {
                const failedResult = {
                    ...item,
                    name: item.name,
                    phone: item.phone,
                    message: buildMessageForItem(item),
                    status: 'failed',
                    error: error.message,
                    timestamp
                };

                results.push(failedResult);
                state.sendResults = results;
                state.sendSummary = {
                    total: state.sendingQueue.length,
                    sent: results.filter((result) => result.status === 'sent').length,
                    failed: results.filter((result) => result.status === 'failed').length
                };
                io.emit('recipient-status', failedResult);
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
        io.emit('completed', {
            manualReviewQueue: state.manualReviewQueue,
            results: state.sendResults,
            summary: state.sendSummary
        });
    })();
}

module.exports = {
    sleep,
    startSendingFlow
};
