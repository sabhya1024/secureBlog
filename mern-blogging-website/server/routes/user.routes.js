import express from 'express';
import { searchUsers, getUserProfile, updateProfile, updateProfileImg } from '../controllers/user.Controller.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { validateImageStream } from "../middleware/streamValidator.js";


const router = express.Router();

router.post("/search-users", searchUsers);
router.post("/get-profile", getUserProfile);
router.post("/update-profile", verifyJWT, updateProfile);
router.post("/update-profile-img", verifyJWT, validateImageStream, updateProfileImg);

export default router;