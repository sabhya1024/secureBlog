import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * Load Firebase service account credentials.
 * Priority:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string) — required in production/CI.
 *   2. Local JSON file fallback — for local development only.
 */
function loadServiceAccountKey() {
    // 1. Environment variable (recommended for production & CI/CD)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (parseErr) {
            console.error(
                `[${new Date().toISOString()}] [SECURITY-CRITICAL]: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var.`,
            );
            console.error(`Reason: ${parseErr.message}`);
            return null;
        }
    }

    // 2. Local file fallback (development only)
    try {
        return require("./blog-website-22df4-firebase-adminsdk-fbsvc-c32edf889b.json");
    } catch {
        console.warn(
            `[${new Date().toISOString()}] [AUTH-MONITOR]: Local service-account JSON not found. ` +
            `Set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.`,
        );
        return null;
    }
}

try {
    const serviceAccountKey = loadServiceAccountKey();

    if (serviceAccountKey) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
        });

        console.info(
            `[${new Date().toISOString()}] [AUTH-MONITOR]: Firebase Admin Initialized successfully`,
        );
    } else {
        // Initialize without credentials — auth-dependent features will be unavailable
        admin.initializeApp();
        console.warn(
            `[${new Date().toISOString()}] [AUTH-MONITOR]: Firebase Admin initialized WITHOUT service-account credentials. ` +
            `Authentication features may not work.`,
        );
    }
} catch (err) {
    console.error(
        `[${new Date().toISOString()}] [SECURITY-CRITICAL]: Firebase Admin Initialization Failed.`,
    );
    console.error(`Reason: ${err.message}`);
}

export default admin;
