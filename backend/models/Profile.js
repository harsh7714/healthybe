const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema({
  userId:          { type: String, required: true, index: true },
  id:              { type: String, required: true, index: true },
  name:            { type: String, required: true },
  relation:        { type: String, required: true },
  age:             { type: String },
  email:           { type: String },
  initials:        { type: String },
  profileImageUrl: { type: String, default: null }, // Stores Base64 string directly in MongoDB
  healthData:      { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true })

// Compound index to ensure id is unique per user
profileSchema.index({ userId: 1, id: 1 }, { unique: true })

module.exports = mongoose.model('Profile', profileSchema)
