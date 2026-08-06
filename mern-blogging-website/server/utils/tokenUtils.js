import jwt from "jsonwebtoken";

//access token -- short lived in RAM/react state
export const generateaccess_token = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

//   Generate a Long-Lived Refresh Token (Stored in HttpOnly Cookie)
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // Master key valid for 1 week
  });
};

//  Verify a Refresh Token (Used when Access Token expires)

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};
