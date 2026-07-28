import argon2 from "argon2";

export const hashPassword = async (password) => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 12 * 1024, 
      timeCost: 3, 
      parallelism: 1, 
    });
  } catch (err) {
    console.error(
      `[SECURITY-CRITICAL]: Password hashing failed: ${err.message}`,
    );
    throw new Error("Internal security error during account creation.");
  }
};


export const comparePassword = async (hash, password) => {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    console.error(
      `[SECURITY-CRITICAL]: Password verification failed: ${err.message}`,
    );
    return false;
  }
};
