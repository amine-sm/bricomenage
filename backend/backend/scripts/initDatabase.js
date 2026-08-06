require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    });

    const sql = fs.readFileSync(
      path.join(__dirname, "../sql/database.sql"),
      "utf8"
    );

    await connection.query(sql);

    console.log("Base MySQL BricoMénage initialisée.");
  } catch (error) {
    console.error("Initialisation impossible :", error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
