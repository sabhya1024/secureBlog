import express from 'express';
import { searchUsers, getUserProfile, updateProfile } from '../controllers/user.Controller.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post("/search-users", searchUsers);
router.post("/get-profile", getUserProfile);
router.post("/update-profile", verifyJWT, updateProfile);

export default router;