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
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A valid URL string is required" });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return res.status(400).json({ error: "Only HTTP and HTTPS URLs are allowed" });
    }

    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ["localhost", "127.0.0.1", "::1", "169.254.169.254", "0.0.0.0"];
    const isPrivateIp = 
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal");

    if (blockedHosts.includes(hostname) || isPrivateIp) {
      return res.status(400).json({ error: "Access to private or internal network addresses is forbidden" });
    }

    const result = await cloudinary.uploader.upload(parsed.href, {
      upload_preset: "blog_website_banner",
    });

    // Return the safe Cloudinary URL
    return res.status(200).json({ secure_url: result.secure_url });
  } catch (error) {
    console.error("URL Upload Error:", error.message || error);
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