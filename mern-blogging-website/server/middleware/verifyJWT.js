import jwt from "jsonwebtoken";

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format:['Bearer'. 'token']

  if (!token) {
    console.warn(`[${new Date().toISOString()}] [AUTH-WARN]: Missing token.`);
    return res.status(401).json({ error: "Access denied. Login required." });
  }

  // Verify against the short-lived (15m) Access Token secret
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // 401 + Code allows React to trigger a silent Refresh Token rotation
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expired",
          code: "ACCESS_TOKEN_EXPIRED",
        });
      }

      // Forbidden: Token is tampered with or entirely fake
      console.error(
        `[${new Date().toISOString()}] [SECURITY-ALERT]: Invalid token.`,
      );
      return res.status(403).json({ error: "Invalid access token." });
    }

    // Attach user ID from payload to request for downstream logic
    req.user = decoded.id;
    next();
  });
};
