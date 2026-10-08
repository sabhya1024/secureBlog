<h1>Security Architecture (OWASP Top 10 Mitigation)</h1>
<hr>

<p>The Secure MERN Blog Platform is engineered with a proactive, defense-in-depth security mindset. This document maps our comprehensive security implementations directly against the <strong>OWASP Top 10 (2021)</strong> vulnerabilities, demonstrating exactly how each attack vector is neutralized across our stack.</p>

<h2>Fully Mitigated Attack Vectors</h2>

<h3>1. A01: Broken Access Control</h3>
<ul>
  <li><strong>verifyJWT Middleware Authorization:</strong> Every protected API route requires cryptographic verification of the JWT signature. The middleware validates the token and securely attaches the validated user ID to the request, ensuring users can never manipulate content they do not own.</li>
  <li><strong>Non-Sequential Identifiers:</strong> Blog URLs and usernames utilize <code>nanoid</code> for generation. These cryptographically secure, non-guessable IDs prevent automated enumeration and Insecure Direct Object Reference (IDOR) attacks.</li>
  <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions distinguish standard users from administrators.</li>
</ul>

<h3>2. A02: Cryptographic Failures</h3>
<ul>
  <li><strong>Argon2id Cryptography:</strong> User passwords are cryptographically hashed using Argon2id with finely tuned parameters (12MB memory cost, 3 iterations, 1 degree of parallelism). This provides robust, memory-hard resistance against modern GPU brute-force and dictionary attacks.</li>
</ul>

<h3>3. A03: Injection (XSS & NoSQL)</h3>
<ul>
  <li><strong>Strict Input Sanitization (XSS):</strong> All user-submitted content (names, bios, comments) is actively sanitized using the <code>validator</code> library. HTML characters are converted to harmless entities, neutralizing Stored XSS attacks.</li>
  <li><strong>HttpOnly Cookie Isolation (XSS):</strong> Refresh tokens are stored exclusively in <code>HttpOnly</code> cookies, denying client-side JavaScript access and eliminating the risk of XSS-based token theft.</li>
  <li><strong>Social Media Link Whitelisting:</strong> Malicious URI protocols such as <code>javascript:</code> or <code>data:</code> are explicitly blocked during profile updates.</li>
  <li><strong>NoSQL Injection Mitigation:</strong> MongoDB queries rely on strictly typed Mongoose schemas, preventing attackers from injecting arbitrary query operators like <code>$gt</code> or <code>$ne</code>.</li>
</ul>

<h3>4. A04: Insecure Design</h3>
<ul>
  <li><strong>Magic Byte File Sniffing (Stream Validator):</strong> File uploads are intercepted at the stream level using <code>busboy</code> and <code>file-type</code>. The server inspects the raw magic bytes of the file stream to prevent malicious extension spoofing (e.g., PHP scripts renamed to .png). If a spoof is detected, the server immediately destroys the socket (<code>req.destroy()</code>).</li>
  <li><strong>Rate Limiting & Abuse Prevention:</strong> Critical endpoints such as <code>/signin</code> and <code>/signup</code> utilize rate-limiting to prevent automated spam and resource exhaustion.</li>
</ul>

<h3>5. A07: Identification and Authentication Failures</h3>
<ul>
  <li><strong>Redis-Backed Token Revocation:</strong> Logouts aren't just client-side deletions. Refresh tokens are hashed and tracked in an in-memory Redis blacklist. If an attacker attempts to reuse a compromised or outdated refresh token, the server actively denies the request (preventing replay attacks).</li>
  <li><strong>Dual-Token Architecture:</strong> Authentication relies on short-lived Access JWTs for authorization and long-lived Refresh JWTs for session continuity.</li>
  <li><strong>Progressive Account Lockout:</strong> To thwart credential stuffing, the platform tracks consecutive failed login attempts. After 5 failed attempts, the account is temporarily locked for 15 minutes.</li>
  <li><strong>Hybrid Authentication:</strong> The application securely merges Email/Password accounts with Google OAuth, strictly validating Firebase JWT tokens before merging.</li>
</ul>

<h3>6. A08: Software and Data Integrity Failures</h3>
<ul>
  <li><strong>Cascading Deletions:</strong> The platform implements safe, recursive data purging. When a user deletes their account, the backend securely deletes all authored blogs, nested comments, and notifications across all collections, preventing orphaned records and database corruption.</li>
  <li><strong>Client-Side Defensive Rendering:</strong> The React frontend utilizes optional chaining and default fallbacks when dealing with populated database references. If a referenced entity is deleted, the UI gracefully renders a "Deleted User" state rather than crashing.</li>
</ul>

<h2>Partially Mitigated / Active Areas of Work</h2>

<h3>7. A09: Security Logging and Monitoring Failures</h3>
<ul>
  <li><strong>Current State:</strong> The system actively logs <code>[SECURITY-CRITICAL]</code> events (such as spoofed file uploads and authentication failures) to the server console.</li>
  <li><strong>Future Roadmap:</strong> We will transition these console logs to a centralized, persistent monitoring tool (like Datadog, Winston, or AWS CloudWatch) to ensure audit trails survive server restarts and trigger real-time developer alerts.</li>
</ul>

<h3>8. A05: Security Misconfiguration</h3>
<ul>
  <li><strong>Current State:</strong> Express server responses are hardened using <code>Helmet</code> middleware, which strips revealing headers like <code>X-Powered-By</code> and enforces strict Content Security Policies (CSP).</li>
  <li><strong>Future Roadmap:</strong> Ensuring production environments strictly enforce <code>NODE_ENV=production</code> to suppress verbose Express error stack traces from inadvertently reaching end-users.</li>
</ul>
