import { v2 as cloudinary } from "cloudinary";

const requiredKeys = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingKeys = requiredKeys.filter(key => !process.env[key])

if (missingKeys.length > 0) {
    console.warn(
      `[${new Date().toISOString()}] [SECURITY-CONFIG]: Missing Cloudinary keys: ${missingKeys.join(", ")}`,
    );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
