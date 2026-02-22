require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());

// Simplified CORS for reliable deployment
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://carizmax.vercel.app',
            'http://localhost:5000',
            'http://127.0.0.1:5000',
            process.env.FRONTEND_URL
        ];
        // Allow if origin is in list, or if no origin (local requests), or if not in production
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            // For production, if you want to be strict, use callback(new Error('...'))
            // But for now, we'll allow it to ensure the user gets up and running
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Serve static files with .html extension support
app.use(express.static(path.join(__dirname, '../client'), { extensions: ['html'] }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));

// Catch-all route to serve index.html for non-API routes (SPA support)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
