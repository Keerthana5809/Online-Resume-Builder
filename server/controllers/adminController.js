const User = require('../models/User');
const Resume = require('../models/Resume');
const Template = require('../models/Template');

// ─── USER MANAGEMENT ─────────────────────────────────────────

// GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// PUT /api/admin/users/:id/toggle-admin
exports.toggleAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot change your own admin status' });
        }
        user.isAdmin = !user.isAdmin;
        await user.save();
        res.json({ msg: `User ${user.isAdmin ? 'promoted to' : 'removed from'} admin`, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot delete yourself' });
        }
        await Resume.deleteMany({ userId: req.params.id });
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User and all their resumes deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ isAdmin: true });
        const totalResumes = await Resume.countDocuments();
        const totalTemplates = await Template.countDocuments({ isActive: true });
        res.json({ totalUsers, totalAdmins, totalResumes, totalTemplates });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ─── TEMPLATE MANAGEMENT ────────────────────────────────────

// POST /api/admin/templates - Upload a new template
exports.uploadTemplate = async (req, res) => {
    try {
        const { name, description, type } = req.body;
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        if (!name || !name.trim()) return res.status(400).json({ msg: 'Template name is required' });

        // Convert buffer to base64 data URL
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        const template = new Template({
            name: name.trim(),
            description: description || '',
            type: type || 'modern',
            previewImage: dataUrl,
            fileType: req.file.mimetype,
            uploadedBy: req.user.id
        });

        await template.save();
        // Return without the heavy base64 image in list responses
        res.status(201).json({
            _id: template._id,
            name: template.name,
            description: template.description,
            type: template.type,
            fileType: template.fileType,
            isActive: template.isActive,
            createdAt: template.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// GET /api/admin/templates - List all templates (admin, no image data for list)
exports.getTemplates = async (req, res) => {
    try {
        const templates = await Template.find().select('-previewImage').sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// DELETE /api/admin/templates/:id
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Template not found' });
        res.json({ msg: 'Template deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// PUT /api/admin/templates/:id/toggle - Toggle isActive
exports.toggleTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Template not found' });
        template.isActive = !template.isActive;
        await template.save();
        res.json({ msg: `Template ${template.isActive ? 'activated' : 'deactivated'}`, template });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
