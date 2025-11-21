import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

const bufferToDataUri = (file = {}) => {
  try {
    const mime = file.mimetype || "image/jpeg";
    const base64 = file.buffer?.toString("base64");
    if (!base64) return "";
    return `data:${mime};base64,${base64}`;
  } catch (_err) {
    return "";
  }
};

export const uploadProductImages = async (files = []) => {
  try {
    if (!files || !files.length) return [];

    const bucket = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

    // If credentials/bucket are missing, fallback to data URIs so frontend can render in dev.
    if (!bucket || !region || !accessKey || !secretKey) {
      console.warn("S3 credentials/bucket missing; storing images as data URIs for now.");
      return files
        .map((file) => bufferToDataUri(file))
        .filter((uri) => typeof uri === "string" && uri.length > 0);
    }

    const uploads = files.map(async (file) => {
      const uniqueName =
        "products/" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 8) +
        "." +
        (file.originalname.split(".").pop() || "jpg");

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: uniqueName,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );
        return `https://${bucket}.s3.${region}.amazonaws.com/${uniqueName}`;
      } catch (error) {
        console.error("S3 upload failed, falling back to data URI for this image:", error?.message || error);
        return bufferToDataUri(file);
      }
    });

    const results = await Promise.all(uploads);
    return results.filter((uri) => typeof uri === "string" && uri.length > 0);
  } catch (error) {
    console.error("S3 upload pipeline failed, returning data URIs:", error?.message || error);
    return files
      .map((file) => bufferToDataUri(file))
      .filter((uri) => typeof uri === "string" && uri.length > 0);
  }
};
