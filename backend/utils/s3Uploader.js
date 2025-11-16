import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

export const uploadProductImages = async (files = []) => {
  if (!files || !files.length) return [];

  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  const uploads = files.map(async (file) => {
    const uniqueName =
      "products/" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8) +
      "." +
      (file.originalname.split(".").pop() || "jpg");

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: uniqueName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return `https://${bucket}.s3.${region}.amazonaws.com/${uniqueName}`;
  });

  return Promise.all(uploads);
};
