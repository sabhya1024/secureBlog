<h1>Secure MERN Blog Platform</h1>
<hr>
<h2>Project Overview</h2>

<p>The Secure MERN Blog Platform is a full-stack, enterprise-grade application built for publishing articles, technical write-ups, and CTF solutions. It features an extreme focus on modern application security practices, scalable architecture, and a seamless user experience. Built on the MVC pattern, it is designed for horizontal scaling, data integrity, and robust defense against common web vulnerabilities.</p>

<h2>Core Technologies</h2>
<ul>
<li><strong>Frontend:</strong> React 18, Vite, TailwindCSS, Framer Motion</li>
<li><strong>Backend:</strong> Node.js, Express.js, MongoDB (Mongoose), Firebase Admin SDK (Google Auth)</li>
<li><strong>Infrastructure:</strong> Redis (Upstash) for session management, Cloudinary for secure media storage</li>
<li><strong>Security:</strong> Argon2id hashing, Dual-Token Strategy (HttpOnly Cookies + short-lived JWTs), Express Rate Limiter, Helmet</li>
</ul>

<h2>Comprehensive Feature Set</h2>

<h3>1. Advanced Authentication & Authorization</h3>
<ul>
<li><strong>Dual-Token Strategy:</strong> Uses short-lived access tokens (15min) coupled with long-lived refresh tokens (7 days) stored securely in HttpOnly, SameSite=Strict cookies. Features automatic token rotation and Redis-backed session invalidation upon logout.</li>
<li><strong>Hybrid Auth:</strong> Supports seamless login via traditional Email/Password OR Google OAuth (verified backend-side via Firebase Admin).</li>
<li><strong>Brute-Force Protection:</strong> Tiered rate-limiting protects the authentication routes, and an active Account Lockout mechanism freezes accounts for 15 minutes after 5 failed login attempts.</li>
</ul>

<h3>2. Content Creation & Editor</h3>
<ul>
<li><strong>Rich Text Editor:</strong> Integrated EditorJS for block-based content creation.</li>
<li><strong>Draft & Publish Pipeline:</strong> Users can securely save drafts or publish directly. The frontend intelligently maps payloads and strictly manages API endpoints using environment variables to prevent accidental data leaks.</li>
<li><strong>Secure Cloudinary Uploads:</strong> Banner uploads are validated locally and on the server via magic-bytes (stream validation), MIME-type checking, and a 5MB size limit before being cryptographically signed by the backend.</li>
</ul>

<h3>3. Search & Discovery Engine</h3>
<ul>
<li><strong>Dynamic Text Querying:</strong> Advanced filtering allows users to search blogs by both tags and raw text queries via a dedicated paginated API.</li>
<li><strong>User Search Sidebar:</strong> The search page intelligently renders related author profiles alongside blog results in a responsive UI (desktop sidebar layout).</li>
<li><strong>Infinite Scrolling:</strong> Integrated "Load More" functionality intelligently pulls paginated data from MongoDB without overwhelming the client.</li>
</ul>

<h3>4. Profile Infrastructure & Social Links</h3>
<ul>
<li><strong>Stable Profile Rendering:</strong> A robust `/user/:id` routing system fetches user personal info and chronological blogs with strict error handling to prevent UI crashes.</li>
<li><strong>Domain Whitelisting for Socials:</strong> Users can update their social media links, but the backend strictly enforces Domain Whitelisting (e.g., rejecting non-YouTube URLs for YouTube inputs) and Protocol Whitelisting to completely neutralize Stored XSS phishing attempts.</li>
</ul>

<h3>5. Performance & UI Polish</h3>
<ul>
<li><strong>Optimized API Queries:</strong> Uses MongoDB Projection (<code>.select()</code>) and Pagination (<code>.skip()/.limit()</code>) to ensure fast data delivery.</li>
<li><strong>Framer Motion:</strong> Silky smooth page transitions and micro-interactions.</li>
<li><strong>Responsive Design:</strong> Fully responsive navigation, including mobile-optimized search bars and dropdown user panels.</li>
</ul>

<h2>Project Status</h2>
<p>The core Backend Authentication, Upload System, Infrastructure, Search APIs, and Database Models are <strong>100% complete</strong>. Frontend layout, routing, Authentication UI, Search Page, and Profile rendering are fully wired. Content Creation (Blog Editor) is currently in active development.</p>
