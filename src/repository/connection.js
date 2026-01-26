import mysql2 from "mysql2/promise";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import fs from "fs"; 
import path from "path";

dotenv.config();

async function connect() {
  //const caCert = fs.readFileSync(path.resolve(process.cwd(),"certs", "ca.pem"));
  const connection = await mysql2.createConnection({
    host: process.env.SQL_HOST,
    password: process.env.SQL_PASSWORD,
    port: process.env.SQL_PORT,
    database: process.env.SQL_DB,
    user: process.env.SQL_USER,
    port: process.env.SQL_PORT || 3306,
    //ssl: process.env.SQL_SSL ? { rejectUnauthorized: true } : null,
    // ssl: {
    //   rejectUnauthorized: true,
    //   ca: caCert
    // },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return connection;
}

async function connectMongoDB() {
  const mongoUrl = process.env.MONGO_URI;
  const client = new MongoClient(mongoUrl)

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB_NAME);
    return { client, db };
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

export default {connect, connectMongoDB}