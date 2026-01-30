const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Reusing schema definitions from Audit where possible, but creating separate model
const auditResponseSchema = new Schema({
    criteriaId: { type: String, required: true },
    selectedOption: { type: String, required: true },
    score: { type: Number, required: true },
    comment: { type: String }
});

const auditVersionSchema = new Schema({
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    responses: [auditResponseSchema],
    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    editedBy: { type: String },
    isDraft: { type: Boolean }
});

const infrastructureAuditSchema = new Schema({
    schoolId: { type: String, required: true },
    accessCode: { type: String, required: true },
    versions: [auditVersionSchema],
    currentVersion: { type: Number, required: true },
    createdAt: { type: String, required: true }
});

module.exports = mongoose.model('InfrastructureAudit', infrastructureAuditSchema);
