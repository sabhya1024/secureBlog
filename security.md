<h1>Security Measures and Defenses</h1>

<p>The Secure MERN Blog Platform is designed with a <strong>secure-by-default</strong> philosophy, following OWASP Top 10 guidelines to defend against common web vulnerabilities. Currently maintaining an 8.5/10 Enterprise Security Rating.</p>

<h2>1. Authentication and Credential Defense</h2>
<ul>
  <li><strong>Password Hashing (Argon2id)</strong>
    <ul>
      <li>OWASP: A02 – Cryptographic Failures</li>
      <li>Passwords are hashed using Argon2id with memory cost and multiple iterations (12MB memory, 3 time cost) to resist brute-force attacks, including GPU attacks.</li>
    </ul>
  </li>
  <li><strong>Dual-Token Strategy & Session Isolation</strong>
    <ul>
      <li>OWASP: A07 – Identification Failures</li>
      <li>Short-lived access tokens (15min) are used alongside long-lived refresh tokens stored in HttpOnly, Secure, SameSite=Strict cookies. This mitigates XSS token theft and CSRF attacks.</li>
      <li>Tokens are tracked in Redis, hashed with SHA-256 prior to storage, and support dynamic revocation/rotation.</li>
    </ul>
  </li>
  <li><strong>Anti-Brute Force & Account Lockouts</strong>
    <ul>
      <li>OWASP: A04 – Insecure Design / Resource Exhaustion</li>
      <li>Critical endpoints (/signin, /signup) are protected by a Tiered Rate Limiter (20 requests/15min).</li>
      <li>Accounts are locked for 15 minutes after 5 failed login attempts to destroy dictionary attacks.</li>
    </ul>
  </li>
  <li><strong>Hybrid Login / Account Merging</strong>
    <ul>
      <li>Google OAuth login uses Firebase Admin SDK on the backend to verify the ID token. It safely merges with existing accounts without bypassing security.</li>
    </ul>
  </li>
</ul>

<h2>2. Injection and Data Integrity</h2>
<ul>
  <li><strong>Input Sanitization & Validation</strong>
    <ul>
      <li>OWASP: A03 – Injection (XSS)</li>
      <li>User input is sanitized using <code>validator.escape()</code>. Emails undergo <code>validator.normalizeEmail()</code> to prevent bypassing uniqueness checks.</li>
      <li>Profile social links undergo strict domain whitelisting (e.g., rejecting non-YouTube URLs in the YouTube slot).</li>
    </ul>
  </li>
  <li><strong>Data Type Enforcement (Mongoose)</strong>
    <ul>
      <li>OWASP: A03 – Injection (NoSQL)</li>
      <li>Mongoose validates data types and prevents operators like <code>$gt</code> from being injected into string fields, eliminating NoSQL injection risks.</li>
    </ul>
  </li>
</ul>

<h2>3. File Upload Security</h2>
<ul>
  <li><strong>Magic-Bytes & Stream Validation</strong>
    <ul>
      <li>OWASP: A04 – Insecure Design</li>
      <li>File uploads are validated at the binary level using magic-bytes checking, rather than trusting file extensions, preventing malicious executables (e.g., PHP scripts disguised as JPGs) from bypassing filters.</li>
    </ul>
  </li>
  <li><strong>Signed Cloudinary Uploads</strong>
    <ul>
      <li>All uploads are limited to 5MB, strictly typed (JPEG/PNG/WebP), and cryptographically signed by the backend before interacting with Cloudinary. Client never receives the API secret.</li>
    </ul>
  </li>
</ul>

<h2>4. Access Control and Server Hardening</h2>
<ul>
  <li><strong>Server Headers / Hardening (Helmet)</strong>
    <ul>
      <li>OWASP: A05 – Security Misconfiguration</li>
      <li>Helmet middleware injects 11 security headers (X-Frame-Options, HSTS, CSP, etc.) and removes fingerprinting headers like <code>X-Powered-By</code>.</li>
    </ul>
  </li>
  <li><strong>CORS & Environment Protection</strong>
    <ul>
      <li>CORS is strictly locked to the frontend URL with <code>credentials: true</code>. Database shuts down (<code>process.exit(1)</code>) immediately if environment variables or connections fail to prevent ghost server execution.</li>
    </ul>
  </li>
</ul>
