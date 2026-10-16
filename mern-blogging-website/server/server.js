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
server.use(mongoSanitize());
server.use(helmet());
server.use(cookieParser());
server.use(globalLimiter);

server.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

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
