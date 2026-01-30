const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mentorSchema = new Schema({
    schoolId: { type: String, required: true },
    name: { type: String, required: true },
    qualification: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    expertise: { type: String, required: true },
    createdAt: { type: String, required: true }
});

module.exports = mongoose.model('Mentor', mentorSchema);
