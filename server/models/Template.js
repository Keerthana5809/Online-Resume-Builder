const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['modern', 'creative', 'classic', 'minimalist', 'executive'],
        default: 'modern'
    },
    // Stored as base64 data URL so it works without external file storage
    previewImage: {
        type: String,  // e.g. "data:image/png;base64,..."
        required: true
    },
    fileType: {
        type: String,  // 'image/jpeg', 'image/png', 'application/pdf'
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Template', TemplateSchema);
