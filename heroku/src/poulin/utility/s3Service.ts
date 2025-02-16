import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME

export const uploadToS3 = async (file: Buffer, filename: string) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `chatbots/${filename}`,
    Body: file,
    ContentType: "image/jpeg",
  })

  await s3Client.send(command)
  return `https://${BUCKET_NAME}.s3.amazonaws.com/chatbots/${filename}`
}
