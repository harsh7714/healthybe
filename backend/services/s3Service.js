const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const presign = (key, expiresIn = 7 * 24 * 60 * 60) =>
  getSignedUrl(s3Client, new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }), { expiresIn })

const uploadToS3 = async (key, buffer, contentType, metadata = {}) => {
  return s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  }))
}

const deleteFromS3 = async (key) => {
  return s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  }))
}

module.exports = {
  s3Client,
  presign,
  uploadToS3,
  deleteFromS3,
}
