import express from "express";
import {
  signup,
  signin,
  google_auth,
  logout,
  refreshTokenHandler,
  setPassword,
  linkGoogle,
  changePassword
} from "../controllers/auth.Controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google-auth", google_auth);
router.post("/logout", logout);
router.post("/refresh", refreshTokenHandler);


router.post("/change-password", verifyJWT, changePassword);

// optional
router.post("/set-password", verifyJWT, setPassword);
router.post("/link-google", verifyJWT, linkGoogle);

export default router;
