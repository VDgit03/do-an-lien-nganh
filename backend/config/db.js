import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

try {
    const connection = await db.getConnection();

    console.log("MySQL connected successfully");

    connection.release();
} catch (error) {
    console.error("MySQL connection failed:", error.message);
}

export default db;
