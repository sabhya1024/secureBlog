import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";

import { createSession, rotateRefreshToken } from "../services/token.service.js";

import { getAuth } from "firebase-admin/auth";
import { nanoid } from "nanoid";
import { hashToken } from "../utils/hashToken.js";

import validator from "validator";
import redisClient from "../utils/redisClient.js";

let emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])\S{8,20}$/;

const generateUsername = async () => {
  let username = `user_${nanoid(8)}`;
  let isUsernameNotUnique = await User.exists({
    "personal_info.username": username,
  });

  while (isUsernameNotUnique) {
    username = `user_${nanoid(8)}`;
    isUsernameNotUnique = await User.exists({
      "personal_info.username": username,
    });
  }
  
  return username;
};

const formatDataToSend = (user, accessToken) => {
  return {
    accessToken,
    user: {
      profile_img: user.personal_info.profile_img,
      username: user.personal_info.username,
      fullname: user.personal_info.fullname,
      email: user.personal_info.email,
    },
  };
};

export const signup = async (req, res) => {
  let { fullname, email, password } = req.body;
  try {


    email = email?.toLowerCase().trim();
    password = password?.trim();
    fullname = fullname?.trim();

    // input validation
    if (!fullname || fullname.length < 3) {
      return res
        .status(403)
        .json({ error: "Fullname must be at least 3 letters long" });
    }

    if (!email) {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    email = validator.normalizeEmail(email);

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address . " });
    }

    if (!password || !passwordRegex.test(password)) {
      return res.status(403).json({
        error:
          "Password should be 8 to 20 characters long with atleast a numeric, 1 special symbol, 1 lowercase and 1 uppercase letters",
      });
    }

    fullname = validator.escape(fullname);

    // 2. Check if user already exists (Standard security check)
    const existingUser = await User.findOne({ "personal_info.email": email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    //3. hash the password
    const hashedPassword = await hashPassword(password);

    // 4. unique username is required
    const username = await generateUsername();

    // 5. Save User to MongoDB
    const user = new User({
      personal_info: {
        fullname,
        email,
        password: hashedPassword,
        username,
      },
    });

    await user.save();
    console.info("User created", {
      email,
      ip: req.ip,
    });

    // 6. Generate Tokens
    const { accessToken, refreshToken } = await createSession(user)

    // 7. Send Refresh Token in a "Locked" HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only sent over HTTPS
      sameSite: "Strict", // Blocks CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 8. Send Access Token + User Info (Exclude password!)
    return res.status(201).json(formatDataToSend(user, accessToken));
  } catch (err) {
    console.error(`[SECURITY-CRITICAL]: Signup Error: ${err.message}`);
    return res
      .status(500)
      .json({ error: "Internal server error during signup." });
  }
};

export const signin = async (req, res) => {
  let { email, password } = req.body;
  try {

    email = email?.toLowerCase().trim();
    password = password?.trim();

    if (!email) {
      return res.status(400).json({ error: "Email can not be empty." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    email = validator.normalizeEmail(email);

    const user = await User.findOne({ "personal_info.email": email });
    if (!user) {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    if (!user.personal_info.password) {
      return res.status(403).json({
        error:
          "This account was created using Google. Please log in with Google.",
      });
    }

    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        error: "Account temporarily locked. Try again later.",
      });
    }

    // auto unlock
    if (user && user.lockUntil && user.lockUntil < Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const isMatch = await comparePassword(
      user.personal_info.password,
      password,
    );

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      }

      await user.save();
      return res.status(403).json({ error: "Invalid credentials" });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    //   generating tokens
    const { accessToken, refreshToken } = await createSession(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(formatDataToSend(user, accessToken));
  } catch (error) {
    console.warn("Failed login attempt", {
      email,
      ip: req.ip,
      time: new Date(),
    });
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const google_auth = async (req, res) => {
  try {
    let { accessToken: firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({
        error: "Google token missing.",
      });
    }

    //verify token with firebase
    const decodedUser = await getAuth().verifyIdToken(firebaseToken);

    let { email, name, picture } = decodedUser;
    picture = picture.replace("s96-c", "s384-c");

    //looking for existing user ...
    let user = await User.findOne({ "personal_info.email": email }).select(
      "personal_info.fullname personal_info.username personal_info.profile_img google_auth",
    );

    if (user) {
      if (!user.google_auth) {
        return res.status(403).json({
          error:
            "This email is registered with password. Please login and link Google from settings.",
        });
      }
    } else {
      let username = await generateUsername();

      user = new User({
        personal_info: {
          fullname: name,
          email: email,

          username: username,
          // no password beacuse of googleauth
        },
        google_auth: true,
      });

      let u = await user.save();
      user = u;

    }

    //tokens for the Google user
    const { accessToken, refreshToken } = await createSession(user)


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json(formatDataToSend(user, accessToken));
  } catch (err) {
    console.error(`[SECURITY-CRITICAL]: Google Auth Error: ${err.message}`);
    return res.status(500).json({ error: "Google authentication failed." });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;


  if (token) {
    const hashedToken = hashToken(token);
    await redisClient.del(hashedToken)
  }

  res.clearCookie("refreshToken");

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const setPassword = async (req, res) => {
  try {
    const userId = req.user;
    let { password } = req.body;

    password = password?.trim();

    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Invalid password format",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.personal_info.password) {
      return res.status(400).json({
        error: "Password already set",
      });
    }

    user.personal_info.password = await hashPassword(password);
    await user.save();

    return res.status(200).json({
      message: "Password set successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

export const linkGoogle = async (req, res) => {
  try {
    const userId = req.user; // authenticated user
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "Google token missing" });
    }

    const decoded = await getAuth().verifyIdToken(accessToken);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔥 CRITICAL CHECK
    if (decoded.email !== user.personal_info.email) {
      return res.status(403).json({
        error: "Google account email does not match",
      });
    }

    if (user.google_auth) {
      return res.status(400).json({
        error: "Google already linked",
      });
    }

    user.google_auth = true;
    await user.save();

    return res.status(200).json({
      message: "Google account linked successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Google linking failed" });
  }
};

export const refreshTokenHandler = async (req, res) => {
  try {
    const oldToken = req.cookies.refreshToken;

    if (!oldToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    // look in redis
    const hashedOld = hashToken(oldToken);
    const userId = await redisClient.get(hashedOld);
    if (!userId) {
      return res.status(403).json({
        error: "Refresh token reuse detected. Please login again.",
      });
    }


    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ error: "User not found." });
    }


    // token rotation
    const { newAccessToken, newRefreshToken } = await rotateRefreshToken
      (oldToken, user)


    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};