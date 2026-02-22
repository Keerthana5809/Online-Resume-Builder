const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalDetails: {
        name: String,
        email: String,
        phone: String,
        address: String,
        linkedin: String,
        github: String
    },
    summary: String,
    education: [{
        institution: String,
        degree: String,
        startDate: String,
        endDate: String,
        description: String
    }],
    experience: [{
        company: String,
        role: String,
        startDate: String,
        endDate: String,
        description: String
    }],
    skills: [String],
    projects: [{
        title: String,
        link: String,
        description: String
    }],
    certifications: [String],
    languages: [String],
    templateType: {
        type: String,
        default: 'template1'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
