import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";

import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";

import "./config/firebase.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import userRoutes from "./routes/user.routes.js";

const PORT = process.env.PORT || 3000;
const server = express();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: { error: "Too many requests, try again later." },
});

server.use(compression());
server.use(express.json({ limit: "10kb" }));
server.use(helmet());
server.use(cookieParser());
server.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

server.use("/api/auth", authLimiter, authRoutes);
server.use("/api/upload", uploadRoutes);
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
