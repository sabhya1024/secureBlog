import Busboy from "busboy";
import { fileTypeFromStream } from "file-type";

export const validateImageStream = (req, res, next) => {
  // 1. Initialize Busboy with a 5MB limit
  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  let fileProcessed = false;

  // 2. Listen for the 'file' event (This triggers as soon as the file starts flowing)
  
  busboy.on("file", async (name, file, info) => {
    const { filename, mimeType } = info;

    try {
      // 3. THE MAGIC BIT CHECK: We look at the stream directly
      const type = await fileTypeFromStream(file);
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!type || !allowedTypes.includes(type.mime)) {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        console.error(
          `[${new Date().toISOString()}] [SECURITY-ALERT]: SPOOFED FILE DETECTED!` +
            ` IP: ${ip} | Extension: ${filename} | Actual Type: ${type?.mime || "Unknown"}`,
        );

        // 4. KILL THE STREAM IMMEDIATELY
        req.unpipe(busboy);
        file.resume(); // Flush the remaining bad data
        req.destroy(); // Physically close the socket
        return res
          .status(403)
          .json({ error: "Security Alert: File signature mismatch." });
      }

      // 5. If safe, we "re-attach" the file stream to the request object
      // This allows our controller to pick it up and send it to Cloudinary
      req.fileStream = file;
      req.fileInfo = info;
      fileProcessed = true;

      next();
    } catch (error) {
      console.error("Stream Inspection Error:", error.message);
      res.status(500).json({ error: "Internal Security Error" });
    }
  });

  // Handle Limit Overflows (DoS Protection)
  busboy.on("filesLimit", () => {
    res.status(413).json({ error: "File too large (Max 5MB)" });
  });

  // 6. Pipe the raw request into Busboy
  req.pipe(busboy);
};
