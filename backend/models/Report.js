const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true }, // user's email/id for multi-tenant isolation
  name:      { type: String, required: true },
  profileId: { type: String, required: true, index: true },
  s3Key:     { type: String, required: true },
  s3Url:     { type: String, default: null },
  mimeType:  { type: String },
  size:      { type: String },
  type:      { type: String, enum: ['PDF', 'IMAGE'], default: 'PDF' },
  analysis:  { type: mongoose.Schema.Types.Mixed, default: null },
  date:      { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)
