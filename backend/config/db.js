const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthybe'
    await mongoose.connect(connStr)
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed (check MONGODB_URI):', err.message)
  }
}

module.exports = connectDB
