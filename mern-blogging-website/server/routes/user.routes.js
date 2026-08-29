import express from "express";
import {
  searchUsers,
  getUserProfile,
  updateProfile,
  updateProfileImg,
  newNotification,
  notifications,
  allNotificationsCount,
  userWrittenBlogs,
  userWrittenBlogsCount,
  deleteAccount
} from "../controllers/user.Controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { validateImageStream } from "../middleware/streamValidator.js";

const router = express.Router();

router.post("/search-users", searchUsers);
router.post("/get-profile", getUserProfile);
router.post("/update-profile", verifyJWT, updateProfile);
router.post("/update-profile-img", verifyJWT, updateProfileImg);

router.get("/new-notification", verifyJWT, newNotification);
router.post("/notifications", verifyJWT, notifications);
router.post("/all-notifications-count", verifyJWT, allNotificationsCount);

router.post("/user-written-blogs", verifyJWT, userWrittenBlogs);
router.post("/user-written-blogs-count", verifyJWT, userWrittenBlogsCount);
router.post("/delete-account", verifyJWT, deleteAccount);

export default router;
