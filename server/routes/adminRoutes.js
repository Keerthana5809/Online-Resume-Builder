const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// All routes require admin authentication
router.get('/stats', adminAuth, adminController.getStats);
router.get('/users', adminAuth, adminController.getUsers);
router.put('/users/:id/toggle-admin', adminAuth, adminController.toggleAdmin);
router.delete('/users/:id', adminAuth, adminController.deleteUser);

module.exports = router;
