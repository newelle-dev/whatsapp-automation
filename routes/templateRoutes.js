const express = require('express');

function createTemplateRoutes({
    state,
    addLog,
    buildMessageForItem,
    readTemplate,
    writeTemplate,
    TEMPLATE_FILE,
    LAST_VISIT_TEMPLATE_FILE,
    LAST_VISIT_DEFAULT_TEMPLATE,
    DEFAULT_TEMPLATE
}) {
    const router = express.Router();

    router.get('/api/template', (req, res) => {
        try {
            const campaign = req.query.campaign === 'last-visit' ? 'last-visit' : 'appointments';
            const templateFile = campaign === 'last-visit' ? LAST_VISIT_TEMPLATE_FILE : TEMPLATE_FILE;
            const fallbackTemplate = campaign === 'last-visit' ? LAST_VISIT_DEFAULT_TEMPLATE : DEFAULT_TEMPLATE;
            const template = readTemplate(templateFile) || fallbackTemplate;
            res.json({ template });
        } catch (err) {
            res.status(500).json({ error: 'Failed to load message template.' });
        }
    });

    router.post('/api/template', async (req, res) => {
        try {
            const { template, campaign } = req.body;
            const campaignType = campaign === 'last-visit' ? 'last-visit' : 'appointments';
            const templateFile = campaignType === 'last-visit' ? LAST_VISIT_TEMPLATE_FILE : TEMPLATE_FILE;

            if (typeof template !== 'string') {
                return res.status(400).json({ error: 'Template must be a string.' });
            }

            await writeTemplate(template, templateFile);

            state.sendingQueue = state.sendingQueue.map((item) => ({
                ...item,
                message: buildMessageForItem(item)
            }));

            state.manualReviewQueue = state.manualReviewQueue.map((item) => ({
                ...item,
                message: buildMessageForItem(item)
            }));

            addLog('Message template updated successfully.');
            res.json({
                message: 'Template updated successfully.',
                template,
                campaign: campaignType,
                sendingQueue: state.sendingQueue,
                manualReviewQueue: state.manualReviewQueue
            });
        } catch (err) {
            console.error('Error saving message template:', err);
            res.status(500).json({ error: 'Failed to save message template.' });
        }
    });

    return router;
}

module.exports = { createTemplateRoutes };
