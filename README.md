# Secure MERN Blog Platform

## Project Overview

A full-stack web application built for publishing articles and technical write-ups. The project utilizes a Model-View-Controller (MVC) architecture and is designed with an emphasis on application security, data integrity, and scalability.

## Core Technologies

- **Frontend:** React 18, Vite, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Firebase Admin SDK
- **Infrastructure:** Redis (Upstash), Cloudinary
- **Security:** Argon2id, JWT (HttpOnly Cookies), Express Rate Limiter, Helmet

## Features & Architecture

### 1. Authentication & Authorization
- **Dual-Token System:** Utilizes short-lived access tokens kept in memory and long-lived refresh tokens stored securely in HttpOnly, SameSite=Strict cookies.
- **Session Management:** Token lifecycles and rotation are tracked via Redis, allowing for immediate session invalidation upon logout.
- **Hybrid Authentication:** Supports standard Email/Password authentication as well as Google OAuth via the Firebase Admin SDK.
- **Brute-Force Protection:** Implements rate-limiting on authentication routes and an account lockout mechanism (15-minute freeze after 5 failed attempts).

### 2. Content Creation
- **Rich Text Editor:** Integrated EditorJS for block-based content formatting.
- **Drafts & Publishing:** Allows users to save drafts or publish directly to the platform.
- **Media Uploads:** Cloudinary integration for image hosting. Uploads are strictly validated via magic-bytes (stream validation), MIME-type checking, and size limits (5MB) before being securely signed on the backend.

### 3. Search & Discovery
- **Text & Tag Querying:** Advanced filtering allows users to search blogs by predefined tags or raw text queries through a paginated API.
- **User Search:** Search results include related author profiles rendered alongside blog results.
- **Pagination:** Integrated "Load More" functionality for fetching paginated data from MongoDB.

### 4. User Profiles & Social Links
- **Profile Rendering:** Dedicated `/user/:id` routing for fetching and displaying public user profiles and chronologically ordered authored blogs.
- **Domain Whitelisting:** Social media links provided by users undergo strict Domain Whitelisting (e.g., enforcing `youtube.com` for YouTube inputs) and Protocol Whitelisting (requiring `http:` or `https:`) to mitigate Stored XSS vulnerabilities.

### 5. Performance
- **Database Optimization:** MongoDB Projection (`.select()`) and Pagination (`.skip()/.limit()`) are used to optimize API response payloads.
- **Responsive UI:** Fully responsive design utilizing TailwindCSS.
