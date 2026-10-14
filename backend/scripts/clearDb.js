require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const {
  DeleteObjectsCommand,
  GetBucketVersioningCommand,
  ListObjectsV2Command,
  S3Client,
} = require('@aws-sdk/client-s3')

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthybe'
const bucket = process.env.AWS_BUCKET_NAME
const databaseName = new URL(mongoUri).pathname.split('/').filter(Boolean)[0]

async function listBucketObjects(client) {
  const objects = []
  let continuationToken
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }))
    objects.push(...(page.Contents || []).map(({ Key }) => ({ Key })))
    continuationToken = page.NextContinuationToken
  } while (continuationToken)
  return objects
}

async function deleteBucketObjects(client, objects) {
  for (let index = 0; index < objects.length; index += 1000) {
    const result = await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: objects.slice(index, index + 1000), Quiet: true },
    }))
    if (result.Errors?.length) throw new Error(`S3 reported ${result.Errors.length} object deletion error(s).`)
  }
}

async function clearData() {
  const confirmation = `--confirm=${databaseName}:${bucket}`
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to clear data when NODE_ENV is production.')
  if (!databaseName || !bucket || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('MongoDB and AWS bucket credentials must be configured before cleanup.')
  }
  if (!process.argv.includes(confirmation)) {
    throw new Error(`Refusing destructive cleanup. To target this configured environment, pass ${confirmation}`)
  }

  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
  })

  try {
    await mongoose.connect(mongoUri)
    if (mongoose.connection.name !== databaseName) throw new Error('Connected MongoDB database does not match the confirmed target.')
    const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray()
    const documentCounts = await Promise.all(collections.map(async ({ name }) => (
      mongoose.connection.db.collection(name).countDocuments()
    )))
    const objectVersioning = await client.send(new GetBucketVersioningCommand({ Bucket: bucket }))
    if (objectVersioning.Status) throw new Error('Refusing to clear a versioned bucket; its object versions need a separate reviewed purge.')
    const objects = await listBucketObjects(client)

    console.log(`Target database: ${databaseName} (${documentCounts.reduce((sum, count) => sum + count, 0)} documents in ${collections.length} collections)`)
    console.log(`Target S3 bucket: ${bucket} in ${process.env.AWS_REGION} (${objects.length} objects)`)
    await deleteBucketObjects(client, objects)
    if ((await listBucketObjects(client)).length) throw new Error('S3 bucket is not empty after deletion; database was preserved.')
    await mongoose.connection.dropDatabase()
    console.log('S3 objects deleted and MongoDB database dropped. The S3 bucket itself and local files were preserved.')
  } finally {
    await mongoose.disconnect()
    client.destroy()
  }
}

clearData().catch(error => {
  console.error(`Cleanup stopped: ${error.message}`)
  process.exitCode = 1
})
