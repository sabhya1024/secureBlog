import mongoose from "mongoose";

const connectDB = async () => {
    try {
       const conn =  await mongoose.connect(process.env.DB_CONNECT, { autoIndex: true });

        console.info(
          `[${new Date().toISOString()}] [DB-MONITOR]: MongoDB Connected: ${conn.connection.host}`,
        );
    } catch (err) {
        console.error(
          `[${new Date().toISOString()}] [SECURITY-CRITICAL]: Database connection failed.`,
        );
        console.error(`Error Details: ${err.message}`);
        process.exit(1);
    }
}

export default connectDB;