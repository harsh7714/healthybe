const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name:  { type: String, required: true },
  password: { type: String, required: true },
  googleId: { type: String, default: null },
  profileImageUrl: { type: String, default: null }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
