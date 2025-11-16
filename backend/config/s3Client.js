import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

export default new S3Client({
  region: process.env.AWS_REGION,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
