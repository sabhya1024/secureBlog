<h1>Secure MERN Blog Platform</h1>
<hr>

<h2>Project Overview</h2>
<p>The Secure MERN Blog Platform is an enterprise-grade, full-stack web application meticulously engineered for publishing blogs, technical write-ups, and articles. Moving beyond basic CRUD applications, this platform emphasizes a <strong>secure-by-default architecture</strong>, high performance, and a modern, highly interactive user experience.</p>

<p>Whether you are publishing detailed tutorials, engaging with a community through nested comments, or managing a portfolio of drafts, this application delivers a seamless experience backed by robust, OWASP-compliant defensive mechanisms—audited manually file-by-file for uncompromising security.</p>

<h2>Core Technologies</h2>
<ul>
  <li><strong>Frontend:</strong> React.js, Vite, Tailwind CSS (for rapid, responsive styling), Framer Motion (for fluid page transitions and component animations).</li>
  <li><strong>Backend:</strong> Node.js, Express.js (REST API architecture with advanced stream validation).</li>
  <li><strong>Database:</strong> MongoDB (Mongoose ORM for strict schema enforcement).</li>
  <li><strong>Caching & Sessions:</strong> Redis (for fast, in-memory JWT blacklisting).</li>
  <li><strong>Authentication:</strong> Firebase Admin SDK (Google OAuth), Argon2id (Memory-hard Cryptographic Hashing), JWT.</li>
  <li><strong>Rich Text:</strong> EditorJS (Block-style editor for clean, modular content generation).</li>
</ul>

<h2>Comprehensive Feature Set</h2>

<h3>Content Creation & Management</h3>
<ul>
  <li><strong>Block-Style Rich Text Editor:</strong> Powered by EditorJS, allowing users to embed code blocks, lists, quotes, and images seamlessly.</li>
  <li><strong>Draft System:</strong> Save works-in-progress locally and to the cloud before publishing.</li>
  <li><strong>Dynamic Pagination & Infinite Scroll:</strong> Optimized MongoDB queries utilizing <code>.skip()</code> and <code>.limit()</code> combined with frontend intersection observers for infinite loading feeds.</li>
  <li><strong>Search & Filtering:</strong> Advanced text-index searching to filter blogs by tags, relevance, most liked, or chronological order.</li>
</ul>

<h3>Community & Engagement</h3>
<ul>
  <li><strong>Nested Comment Threads:</strong> Users can comment and reply to specific comments, creating a hierarchical, Reddit-style discussion tree.</li>
  <li><strong>Real-Time Notifications:</strong> An in-app notification center alerts users when their blogs are liked, commented on, or when they receive replies to their comments.</li>
  <li><strong>Social Profiles:</strong> Dedicated user profile pages showcasing published works, total read counts, and whitelisted social media links.</li>
</ul>

<h3>Security & Privacy (See SECURITY.md)</h3>
<ul>
  <li><strong>Hybrid Authentication:</strong> Merge traditional Email/Password accounts with Google OAuth seamlessly.</li>
  <li><strong>Dual-Token Sessions:</strong> Access JWTs combined with HttpOnly Refresh Cookies.</li>
  <li><strong>Magic Byte File Sniffing:</strong> Protection against malicious file uploads by destroying spoofed file stream sockets before they hit cloud storage.</li>
  <li><strong>Progressive Lockouts:</strong> Automated defenses against brute-force attacks via server-side locking.</li>
  <li><strong>Data Purging:</strong> Complete, recursive cascading deletes for user accounts ensuring no orphaned data is left behind.</li>
</ul>

<h2>Installation and Setup</h2>
<p>To run this project locally, ensure you have Node.js, MongoDB, and optionally Redis installed and running on your system.</p>

<h3>1. Backend Setup</h3>
<ol>
  <li>Navigate to the <code>server</code> directory: <code>cd server</code></li>
  <li>Install dependencies: <code>npm install</code></li>
  <li>Create a <code>.env</code> file in the <code>server</code> directory and configure the following variables:
    <ul>
      <li><code>DB_LOCATION</code> - Your MongoDB connection string.</li>
      <li><code>SECRET_ACCESS_KEY</code> - Secret for signing Access JWTs.</li>
      <li><code>SECRET_REFRESH_KEY</code> - Secret for signing Refresh JWTs.</li>
      <li><code>REDIS_URL</code> - Connection string for your Redis instance.</li>
      <li>Firebase Admin SDK credentials (for Google Auth).</li>
    </ul>
  </li>
  <li>Start the backend server: <code>npm start</code></li>
</ol>

<h3>2. Frontend Setup</h3>
<ol>
  <li>Navigate to the frontend directory: <code>cd "blogging website - frontend"</code></li>
  <li>Install dependencies: <code>npm install</code></li>
  <li>Create a <code>.env</code> file in the frontend directory and configure:
    <ul>
      <li><code>VITE_BACKEND_URL</code> - URL of your local backend (e.g., <code>http://localhost:3000</code>).</li>
    </ul>
  </li>
  <li>Start the Vite development server: <code>npm run dev</code></li>
</ol>

<h2>Project Structure</h2>
<ul>
  <li><code>/server</code> - Express.js backend, Mongoose models, authentication logic, Redis integrations, and socket-destroying stream validation middleware.</li>
  <li><code>/blogging website - frontend</code> - React application, context providers, EditorJS configurations, and Tailwind styling.</li>
</ul>
