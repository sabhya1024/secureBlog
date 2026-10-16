import Busboy from "busboy";
import { fileTypeStream } from "file-type";

export const validateImageStream = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
  }

  // Initialize Busboy with a 5MB limit and max 1 file
  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

  let fileFound = false;
  let fileTooLarge = false;

  busboy.on("file", async (name, file, info) => {
    if (fileFound) {
      file.resume();
      return;
    }
    fileFound = true;

    file.on("limit", () => {
      fileTooLarge = true;
      file.resume();
    });

    try {
      // Magic bit check: inspect stream directly
      const streamWithFileType = await fileTypeStream(file);
      const type = streamWithFileType.fileType;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (fileTooLarge) {
        return res.status(413).json({ error: "File exceeds 5MB limit" });
      }

      if (!type || !allowedTypes.includes(type.mime)) {
        const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
        console.error(
          `[${new Date().toISOString()}] [SECURITY-ALERT]: SPOOFED FILE DETECTED!` +
            ` IP: ${ip} | Extension: ${info?.filename} | Actual Type: ${type?.mime || "Unknown"}`,
        );

        file.resume();
        return res.status(403).json({ error: "Security Alert: File signature mismatch. Only JPEG, PNG, and WebP images are allowed." });
      }

      // Re-attach the safe file stream to the request object
      req.fileStream = streamWithFileType;
      req.fileInfo = info;

      next();
    } catch (error) {
      console.error("Stream Inspection Error:", error.message || error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Internal Security Error during file validation" });
      }
    }
  });

  busboy.on("close", () => {
    if (!fileFound && !res.headersSent) {
      return res.status(400).json({ error: "No image file provided in request" });
    }
  });

  busboy.on("error", (err) => {
    console.error("Busboy Stream Error:", err.message || err);
    if (!res.headersSent) {
      return res.status(400).json({ error: "Malformed multipart stream" });
    }
  });

  req.pipe(busboy);
};
