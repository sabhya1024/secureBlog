import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { validateImageStream } from "../middleware/streamValidator.js";


//cloudinary secrets configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const router = express.Router()

router.get("/get-upload-signature", verifyJWT, (req, res) => {
  try {
    //timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // preset name
    const uploadPreset = "blog_website_banner";

    // generate the cryptographic signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        upload_preset: uploadPreset,
      },
      process.env.CLOUDINARY_API_SECRET,
    );

    // 4. Send the required data back to React
    return res.status(200).json({
      signature: signature,
      timestamp: timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      upload_preset: uploadPreset,
    });
  } catch (error) {
    console.error("Signature Generation Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate upload signature" });
  }
});

router.post("/upload-by-url", verifyJWT, async (req, res) => {
  try {
    const { url } = req.body;
    // Cloudinary will automatically download the image from 
    // the user's URL, verify it, and securely upload it to your Cloudinary account.
    const result = await cloudinary.uploader.upload(url, {
      upload_preset: "blog_website_banner",
    });

    // Return the safe Cloudinary URL
    return res.status(200).json({ secure_url: result.secure_url });
  } catch (error) {
    console.error("URL Upload Error:", error);
    return res.status(500).json({ error: "Failed to upload image from URL" });
  }
});

router.post("/image", verifyJWT, validateImageStream, (req, res) => {
  try {
    // We pipe the stream directly from the request to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { upload_preset: "blog_website_banner" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ error: "Failed to upload image to cloud" });
        }
        return res.status(200).json({ secure_url: result.secure_url });
      }
    );

    // Pipe the validated file stream into Cloudinary
    if (req.fileStream) {
      req.fileStream.pipe(uploadStream);
    } else {
      return res.status(400).json({ error: "No valid image stream found" });
    }
  } catch (error) {
    console.error("Proxy Upload Error:", error);
    return res.status(500).json({ error: "Internal Server Error during upload proxy" });
  }
});

export default router