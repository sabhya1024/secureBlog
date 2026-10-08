import admin from "firebase-admin";

/**
 * Load Firebase service account credentials from FIREBASE_SERVICE_ACCOUNT_KEY env var.
 */
function loadServiceAccountKey() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error(
            `[${new Date().toISOString()}] [SECURITY-CRITICAL]: FIREBASE_SERVICE_ACCOUNT_KEY env var is not set.`,
        );
        return null;
    }

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
