const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Multer: memory storage, accept images & PDF, max 5MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only JPG, PNG, WebP, or PDF files are allowed'));
    }
});

// ── Stats
router.get('/stats', adminAuth, adminController.getStats);

// ── User management
router.get('/users', adminAuth, adminController.getUsers);
router.put('/users/:id/toggle-admin', adminAuth, adminController.toggleAdmin);
router.delete('/users/:id', adminAuth, adminController.deleteUser);

// ── Template management (admin only)
router.get('/templates', adminAuth, adminController.getTemplates);
router.post('/templates', adminAuth, upload.single('templateFile'), adminController.uploadTemplate);
router.put('/templates/:id/toggle', adminAuth, adminController.toggleTemplate);
router.delete('/templates/:id', adminAuth, adminController.deleteTemplate);

module.exports = router;
