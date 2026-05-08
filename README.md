<h1>Secure MERN Blog Platform</h1>
<hr>
<h2> Project Overview</h2>

<p>The Secure MERN Blog Platform is a full-stack application built for publishing articles, technical write-ups, and CTF solutions, with an extreme focus on modern application security practices. The architecture is modular (MVC) and designed for horizontal scaling and data integrity. </p>

<h2>Core Technologies</h2>
<ul>
<li>Backend: Node.js, Express.js, MongoDB (Mongoose), Firebase Admin SDK (for Google Auth). </li>

<li>Security: Argon2id, JWT (HttpOnly Cookies), Express Rate Limiter, Helmet. </li>

<li>Data Integrity: Multi-document transaction patterns, nanoid for URL slugs, validator for input sanitation.</li>
</ul>

<h2>Key Features</h2>
<ul>

<li>Secure Authentication: User signup and signin protected by Argon2id password hashing and Tiered Rate Limiting.</li>

<li>Hybrid Auth: Supports seamless login/account merging via Email/Password OR Google OAuth.</li>

<li>Robust Access Control: Protected routes enforce token validation via middleware before accessing creation logic.</li>

<li>Content Safety: All user-submitted text is sanitized and escaped to prevent Stored XSS attacks.</li>

<li>Performance: Optimized API queries using MongoDB Projection (.select()) and Pagination (.skip()/.limit()) to ensure fast home feed loading.</li>

<ul>
## Screenshots

![Home Feed](POC/Login.png)
![Auth Page](POC/successfulSignup.png)
