import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";

import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import "./config/firebase.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import userRoutes from "./routes/user.routes.js";

const PORT = process.env.PORT || 3000;
const server = express();

// Global rate limiter (defense in depth against API flooding)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests from this IP, try again later." },
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: { error: "Too many authentication requests, try again later." },
});

// Rate limiter for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Upload limit reached, please try again later." },
});

server.use(compression());
server.use(express.json({ limit: "10kb" }));

// Express 5 compatible sanitization middleware (mutates objects without reassigning getter)
server.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

server.use(helmet());
server.use(cookieParser());
server.use(globalLimiter);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : ["http://localhost:5173"];

server.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

server.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

server.use("/api/auth", authLimiter, authRoutes);
server.use("/api/upload", uploadLimiter, uploadRoutes);
server.use("/api/blog", blogRoutes);
server.use("/api/user", userRoutes);

try {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (err) {
  console.error("Failed to connect to Database:", err);
  process.exit(1);
}
