const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  time: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isImage: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: null
  },
  imagePrompt: {
    type: String,
    default: null
  },
  imageCaption: {
    type: String,
    default: null
  },
  imageTags: [{
    type: String
  }],
  attachedReportName: {
    type: String,
    default: null
  }
}, { _id: true })

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  profileId: {
    type: String,
    default: 'self',
    index: true
  },
  profileName: {
    type: String,
    default: 'Self'
  },
  title: {
    type: String,
    required: true,
    default: 'Health Consultation'
  },
  summary: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  messages: [messageSchema],
  hasImages: {
    type: Boolean,
    default: false,
    index: true
  },
  imageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true })

// Index for fast sorting and searching
chatSessionSchema.index({ userId: 1, lastMessageAt: -1 })
chatSessionSchema.index({ userId: 1, profileId: 1, lastMessageAt: -1 })

module.exports = mongoose.model('ChatSession', chatSessionSchema)
