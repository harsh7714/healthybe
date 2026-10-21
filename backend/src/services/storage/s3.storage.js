const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3')

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function save(key, buffer, contentType, metadata = {}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    }),
  )
  return { storage: 's3', key }
}

async function read(report) {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: report.s3Key }),
  )
  const chunks = []
  for await (const chunk of response.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function remove(report) {
  return s3Client.send(
    new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: report.s3Key }),
  )
}

module.exports = { read, remove, save }
