const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const loginSessionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee', 'viewer'], required: true },
    timestamp: { type: String, required: true },
    deviceInfo: {
        browser: { type: String, required: true },
        os: { type: String, required: true },
        device: { type: String, required: true }, // 'Mobile' | 'Tablet' | 'Desktop'
        userAgent: { type: String, required: true }
    },
    ipAddress: { type: String, required: true },
    location: {
        city: { type: String },
        country: { type: String }
    },
    status: { type: String, enum: ['active', 'logged_out'], required: true },
    logoutTimestamp: { type: String }
});

module.exports = mongoose.model('LoginSession', loginSessionSchema);
