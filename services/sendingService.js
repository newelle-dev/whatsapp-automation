function sleep(min = 15000, max = 45000) {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function startSendingFlow({ state, io, addLog, buildMessageForItem }) {
    (async () => {
        const results = [];
        let sentCount = 0;
        let failedCount = 0;

        try {
            for (let i = 0; i < state.sendingQueue.length; i++) {
                const item = state.sendingQueue[i];
                const timestamp = new Date().toISOString();
                let messageText = item.message || '';

                try {
                    messageText = buildMessageForItem(item);
                    addLog(`[${i + 1}/${state.sendingQueue.length}] Sending to ${item.name} (${item.phone})...`);

                    if (!state.whatsappClient) {
                        throw new Error('WhatsApp client is not available. Please re-authenticate and retry.');
                    }

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
                    sentCount += 1;
                    state.sendResults = results;
                    state.sendSummary = {
                        total: state.sendingQueue.length,
                        sent: sentCount,
                        failed: failedCount
                    };
                    io.emit('recipient-status', nextResult);

                    addLog(`Success! Messages sent: ${i + 1}/${state.sendingQueue.length}`);
                } catch (error) {
                    const failedResult = {
                        ...item,
                        name: item.name,
                        phone: item.phone,
                        message: messageText,
                        status: 'failed',
                        error: error.message,
                        timestamp
                    };

                    results.push(failedResult);
                    failedCount += 1;
                    state.sendResults = results;
                    state.sendSummary = {
                        total: state.sendingQueue.length,
                        sent: sentCount,
                        failed: failedCount
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
        } catch (fatalError) {
            failedCount += 1;
            state.sendSummary = {
                total: state.sendingQueue.length,
                sent: sentCount,
                failed: Math.max(failedCount, state.sendSummary.failed)
            };
            addLog(`FATAL: Sending flow stopped unexpectedly - ${fatalError.message}`);
        } finally {
            state.isSending = false;
            addLog('=== FINISHED SENDING ===');
            io.emit('completed', {
                manualReviewQueue: state.manualReviewQueue,
                results: state.sendResults,
                summary: state.sendSummary
            });
        }
    })();

}

module.exports = {
    sleep,
    startSendingFlow
};
