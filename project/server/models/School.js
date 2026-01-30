const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schoolSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  code: { type: String },
  createdBy: { type: String, required: true }, // Employee username
  createdAt: { type: String, required: true }
});

module.exports = mongoose.model('School', schoolSchema);
