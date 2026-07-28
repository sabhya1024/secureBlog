<h1>Secure MERN Blog Platform</h1>
<hr>
<h2> Project Overview</h2>

<p>The Secure MERN Blog Platform is a full-stack application built for publishing articles, technical write-ups, and CTF solutions. It features an extreme focus on modern application security practices and enterprise-grade architecture. Built on the MVC pattern, it is designed for horizontal scaling, data integrity, and robust defense against common web vulnerabilities.</p>

<h2>Core Technologies</h2>
<ul>
<li><strong>Frontend:</strong> React 18, Vite, TailwindCSS, Framer Motion</li>
<li><strong>Backend:</strong> Node.js, Express.js, MongoDB (Mongoose), Firebase Admin SDK (Google Auth)</li>
<li><strong>Infrastructure:</strong> Redis (Upstash) for session management, Cloudinary for secure media storage</li>
<li><strong>Security:</strong> Argon2id, Dual-Token Strategy (HttpOnly Cookies + short-lived JWTs), Express Rate Limiter, Helmet</li>
</ul>

<h2>Key Features & Architecture</h2>
<ul>

<li><strong>Secure Authentication & Dual-Token Strategy:</strong> Uses short-lived access tokens (15min) coupled with long-lived refresh tokens (7 days) stored securely in HttpOnly, SameSite=Strict cookies. Features automatic token rotation and Redis-backed session invalidation upon logout.</li>

<li><strong>Hybrid Auth & Account Lockout:</strong> Supports seamless login via Email/Password OR Google OAuth. Incorporates brute-force protection locking out accounts for 15 minutes after 5 failed attempts.</li>

<li><strong>Robust Access Control:</strong> Protected routes enforce strict JWT token validation middleware. Redis is used to track token lifecycles and forcefully revoke access when necessary.</li>

<li><strong>Content Safety & Upload Security:</strong> All user-submitted text is sanitized (via <code>validator.escape()</code>). Image uploads to Cloudinary are strictly validated via magic-bytes (stream validation), MIME-type checking, and 5MB size limits before being securely signed by the backend.</li>

<li><strong>Performance & Optimization:</strong> Optimized API queries using MongoDB Projection and Pagination. Fast asset delivery and responsive UI using Framer Motion page transitions.</li>

</ul>

<h2>Project Status</h2>
<p>The core Backend Authentication, Upload System, Infrastructure, and Database Models are <strong>100% complete</strong>. Frontend layout, routing, and Authentication UI are fully wired. Content Creation (Blog Editor) and Content Reading (Home Feed) are currently in active development.</p>
