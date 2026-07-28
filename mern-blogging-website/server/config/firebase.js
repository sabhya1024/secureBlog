import admin from "firebase-admin";
import { createRequire } from "module";


const require = createRequire(import.meta.url);

try {
    const serviceAccountKey = require("./blog-website-22df4-firebase-adminsdk-fbsvc-c32edf889b.json");
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
    });

    console.info(
      `[${new Date().toISOString()}] [AUTH-MONITOR]: Firebase Admin Initialized successfully `,
    );

} catch (err) {
    console.error(
      `[${new Date().toISOString()}] [SECURITY-CRITICAL]: Firebase Admin Initialization Failed.`,
    );
    console.error(`Reason: ${err.message}`);
}


export default admin;
