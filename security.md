<h1>Security Measures and Defenses</h1>

<p>The Secure MERN Blog Platform is designed with a <strong>secure-by-default</strong> philosophy, following OWASP Top 10 guidelines to defend against common web vulnerabilities. Currently maintaining an 8.5/10 Enterprise Security Rating.</p>

<h2>1. Authentication and Credential Defense (OWASP A02, A07)</h2>
<ul>
  <li><strong>Password Hashing (Argon2id):</strong> Passwords are hashed using Argon2id with memory cost (12MB) and multiple iterations (3 time cost) to resist brute-force and GPU attacks.</li>
  <li><strong>Dual-Token Strategy & Session Isolation:</strong> Short-lived access tokens (15min) are kept in memory, while long-lived refresh tokens are stored in HttpOnly, Secure, SameSite=Strict cookies. This mitigates XSS token theft and CSRF attacks.</li>
  <li><strong>Token Rotation & Redis Revocation:</strong> Tokens are tracked in Redis, hashed with SHA-256 prior to storage, allowing for dynamic revocation/rotation and immediate session invalidation on logout.</li>
  <li><strong>Hybrid Login / Account Merging:</strong> Google OAuth login securely uses the Firebase Admin SDK on the backend to verify the ID token, merging accounts without bypassing security protocols.</li>
</ul>

<h2>2. Anti-Brute Force & Denial of Service (OWASP A04)</h2>
<ul>
  <li><strong>Account Lockouts:</strong> The authentication controller actively monitors login attempts. 5 failed attempts trigger an automatic 15-minute account lockout to destroy dictionary attacks.</li>
  <li><strong>Tiered Rate Limiting:</strong> Critical endpoints (/signin, /signup) are protected by a Tiered Rate Limiter (20 requests/15min) via <code>express-rate-limit</code>.</li>
  <li><strong>Payload Type Checking:</strong> Strict backend validation ensures payload fields (like <code>title</code> or <code>tags</code>) match expected types (Strings/Arrays). This prevents attackers from passing Objects to string methods and crashing the Node server (DoS).</li>
</ul>

<h2>3. Injection and Data Integrity (OWASP A03)</h2>
<ul>
  <li><strong>Input Sanitization:</strong> All user input is sanitized using <code>validator.escape()</code>. Emails undergo <code>validator.normalizeEmail()</code> to prevent bypassing uniqueness checks.</li>
  <li><strong>NoSQL Injection Prevention:</strong> By strictly relying on Mongoose schemas and avoiding raw MongoDB queries, the backend prevents operators like <code>$gt</code> from being injected into string fields.</li>
  <li><strong>Data Minimization:</strong> API endpoints (like <code>/create-blog</code>) strictly return minimal required data (e.g., returning only the <code>blog_id</code> instead of the entire document) to prevent excessive data exposure.</li>
</ul>

<h2>4. Social Links Protection & URL Parsing (OWASP A03)</h2>
<ul>
  <li><strong>Machine-Level URL Parsing:</strong> The <code>/api/user/update-profile</code> endpoint passes all user-submitted social links through Node's cryptographic URL parser.</li>
  <li><strong>Protocol Whitelisting:</strong> Extracts the protocol and strictly enforces <code>http:</code> or <code>https:</code>. This completely blocks payloads like <code>javascript:alert(1)</code> or <code>vbscript:</code>, neutralizing Stored XSS.</li>
  <li><strong>Strict Domain Whitelisting:</strong> Uses a domain dictionary to enforce strict hostnames. For example, YouTube links must end in <code>youtube.com</code> or <code>youtu.be</code>, preventing attackers from linking to phishing sites or malware disguised as social profiles.</li>
</ul>

<h2>5. File Upload Security (OWASP A04)</h2>
<ul>
  <li><strong>Magic-Bytes & Stream Validation:</strong> File uploads are validated at the binary level using magic-bytes checking, rather than trusting file extensions. This prevents malicious executables (e.g., PHP scripts disguised as JPGs) from bypassing filters.</li>
  <li><strong>Signed Cloudinary Uploads:</strong> Uploads are limited to 5MB, strictly typed (JPEG/PNG/WebP), and cryptographically signed by the backend before interacting with Cloudinary. The client never receives the API secret.</li>
</ul>

<h2>6. Access Control and Server Hardening (OWASP A01, A05, A09)</h2>
<ul>
  <li><strong>Granular Authorization:</strong> The <code>verifyJWT</code> middleware protects sensitive routes. For example, the <code>/create-blog</code> endpoint extracts the author ID directly from the secure JWT payload instead of trusting user-provided data.</li>
  <li><strong>Security Headers (Helmet):</strong> Helmet middleware injects 11 security headers (X-Frame-Options, HSTS, CSP, etc.) and removes fingerprinting headers like <code>X-Powered-By</code>.</li>
  <li><strong>Robust Security Logging:</strong> Replaced generic crashes with detailed logging (<code>console.error</code>, <code>console.info</code>) that track timestamps, specific User IDs, and exact event contexts for post-incident audits. Raw database errors are scrubbed before reaching the client to prevent schema leakage.</li>
  <li><strong>Environment Protection:</strong> CORS is strictly locked to the frontend URL with <code>credentials: true</code>. The database shuts down (<code>process.exit(1)</code>) immediately if environment variables or connections fail to prevent ghost server execution.</li>
</ul>
