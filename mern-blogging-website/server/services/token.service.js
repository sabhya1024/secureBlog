import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils.js";

import crypto from "crypto";
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

import redisClient from "../utils/redisClient.js";

export const createSession = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  const hashedToken = hashToken(refreshToken);

  await redisClient.set(
    hashedToken,
    user._id.toString(),
    { EX: 7 * 24 * 60 * 60 }, // 7 days
  );

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (oldToken, user) => {
  try {
    verifyRefreshToken(oldToken);
  } catch (err) {
    throw new Error("INVALID_TOKEN");
  }

  const hashedOldToken = hashToken(oldToken);

 
  const userId = await redisClient.get(hashedOldToken);

  if (!userId) {
    throw new Error("TOKEN_REUSE_DETECTED");
  }

  // delete old token
  await redisClient.del(hashedOldToken);

  //generate new tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  const newHashed = hashToken(newRefreshToken);

  // store new token
  await redisClient.set(newHashed, user._id.toString(), {
    EX: 7 * 24 * 60 * 60,
  });

  return { newAccessToken, newRefreshToken };
};