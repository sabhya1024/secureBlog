# Security Measures and Defenses

The Secure MERN Blog Platform incorporates standard security practices following OWASP Top 10 guidelines to mitigate common web vulnerabilities.

## 1. Authentication and Credential Management
- **Password Hashing:** Passwords are hashed using Argon2id with appropriate memory and time cost parameters.
- **Session Isolation:** Short-lived access tokens (15 minutes) are kept in memory. Long-lived refresh tokens are stored in HttpOnly, Secure, SameSite=Strict cookies to mitigate XSS and CSRF risks.
- **Token Rotation & Revocation:** Tokens are tracked in Redis (hashed with SHA-256) to support dynamic revocation and immediate session invalidation.
- **OAuth Merging:** Google OAuth login utilizes the Firebase Admin SDK on the backend to verify the ID token securely before merging accounts.

## 2. Brute Force & DoS Protection
- **Account Lockouts:** The authentication controller actively monitors login attempts. Five failed attempts trigger an automatic 15-minute account lockout.
- **Rate Limiting:** Critical endpoints (`/signin`, `/signup`) are protected by a Tiered Rate Limiter (20 requests per 15 minutes).
- **Payload Validation:** Strict backend validation ensures payload fields (like `title` or `tags`) match expected types (Strings/Arrays) before processing, preventing DoS attacks via type manipulation.

## 3. Injection & Data Integrity
- **Input Sanitization:** User input is sanitized using `validator.escape()`. Emails undergo `validator.normalizeEmail()`.
- **NoSQL Injection Prevention:** The application strictly relies on Mongoose schemas to prevent MongoDB operators (like `$gt`) from being injected into string fields.
- **Data Minimization:** API endpoints limit database exposure by only returning required fields via Mongoose projections.

## 4. Social Links & URL Parsing
- **Machine-Level URL Parsing:** The `/api/user/update-profile` endpoint passes all user-submitted social links through Node's native cryptographic URL parser.
- **Protocol Whitelisting:** The parser extracts the protocol and strictly enforces `http:` or `https:`, blocking payloads like `javascript:` or `vbscript:` to neutralize Stored XSS.
- **Domain Whitelisting:** A domain dictionary enforces strict hostnames for social platforms (e.g., YouTube links must end in `youtube.com` or `youtu.be`).

## 5. File Upload Security
- **Magic-Bytes & Stream Validation:** File uploads are validated at the binary level using magic-bytes checking rather than relying on user-provided file extensions.
- **Signed Uploads:** Uploads are limited to 5MB, strictly typed (JPEG/PNG/WebP), and cryptographically signed by the backend before interacting with the Cloudinary CDN.

## 6. Access Control and Server Hardening
- **Granular Authorization:** The `verifyJWT` middleware protects sensitive routes. The author ID is extracted directly from the verified JWT payload instead of trusting user-provided data.
- **Security Headers:** Helmet middleware is used to inject standard security headers (X-Frame-Options, HSTS, CSP) and remove fingerprinting headers.
- **Environment Protection:** CORS policies restrict API access to the designated frontend URL. The database connection logic initiates an immediate process exit on failure to prevent ghost server execution.
