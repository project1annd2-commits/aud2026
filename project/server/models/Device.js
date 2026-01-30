const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const deviceSchema = new Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['mobile', 'tablet', 'desktop'], required: true },
    os: { type: String, required: true },
    browser: { type: String, required: true },
    ipAddress: { type: String, required: true },
    lastLoginAt: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
    approvedBy: { type: String },
    approvedAt: { type: String },
    createdAt: { type: String, required: true }
});

module.exports = mongoose.model('Device', deviceSchema);
