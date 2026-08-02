const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthybe'
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000 // Fast 2 second fallback if MongoDB is offline
    })
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.warn('⚠️  MongoDB connection offline:', err.message, '→ Fallback to In-Memory store')
  }
}

module.exports = connectDB
