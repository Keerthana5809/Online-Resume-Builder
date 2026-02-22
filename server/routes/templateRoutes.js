const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const auth = require('../middleware/auth');

// GET /api/templates - Get all active templates (with preview image)
router.get('/', auth, async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/templates/:id - Get single template by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template || !template.isActive) return res.status(404).json({ msg: 'Template not found' });
        res.json(template);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
