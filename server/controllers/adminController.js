const User = require('../models/User');
const Resume = require('../models/Resume');

// GET /api/admin/users - Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// PUT /api/admin/users/:id/toggle-admin - Toggle admin status
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

// DELETE /api/admin/users/:id - Delete a user and their resumes
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

// GET /api/admin/stats - Get platform stats
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ isAdmin: true });
        const totalResumes = await Resume.countDocuments();
        res.json({ totalUsers, totalAdmins, totalResumes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
