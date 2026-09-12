require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const Report = require('../models/Report')
const Profile = require('../models/Profile')
const User = require('../models/User')
const { deleteFromS3 } = require('../services/s3Service')

async function clearDatabase() {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthybe'
  console.log('Connecting to MongoDB...')
  await mongoose.connect(connStr)
  console.log('Connected to MongoDB.\n')

  // 1. Delete S3 files for all existing reports
  const reports = await Report.find({})
  console.log(`Found ${reports.length} report(s) in database.`)

  for (const report of reports) {
    if (report.s3Key && (!report.s3Url || !report.s3Url.startsWith('data:'))) {
      try {
        console.log(`Deleting S3 file: ${report.s3Key}`)
        await deleteFromS3(report.s3Key)
        console.log(`  Successfully deleted S3 key: ${report.s3Key}`)
      } catch (err) {
        console.warn(`  Failed to delete S3 key (${report.s3Key}): ${err.message}`)
      }
    }
  }

  // 2. Clean local uploads directory if any files exist
  const uploadsDir = path.join(__dirname, '..', 'uploads')
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir)
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(uploadsDir, file))
          console.log(`Deleted local upload file: ${file}`)
        } catch (err) {
          console.warn(`Failed to delete local file (${file}): ${err.message}`)
        }
      }
    }
  }

  // 3. Clear database collections
  const reportResult = await Report.deleteMany({})
  const profileResult = await Profile.deleteMany({})
  const userResult = await User.deleteMany({})

  console.log('\n--- Database Cleanup Summary ---')
  console.log(`Reports deleted:  ${reportResult.deletedCount}`)
  console.log(`Profiles deleted: ${profileResult.deletedCount}`)
  console.log(`Users deleted:    ${userResult.deletedCount}`)
  console.log('--------------------------------\n')

  await mongoose.disconnect()
  console.log('Database connection closed. Database has been cleared successfully!')
}

clearDatabase().catch((err) => {
  console.error('Error clearing database:', err)
  process.exit(1)
})
