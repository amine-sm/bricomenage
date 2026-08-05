require("dotenv").config();

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sql = fs.readFileSync(
      path.join(__dirname, "../sql/seed.sql"),
      "utf8"
    );

    await client.query(sql);

    const email = String(
      process.env.ADMIN_EMAIL || "admin@bricomenage.dz"
    )
      .trim()
      .toLowerCase();

    const password = String(
      process.env.ADMIN_PASSWORD || "Admin@123"
    );

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `
        INSERT INTO admins (
          name,
          email,
          password_hash
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (email)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          is_active = TRUE,
          updated_at = NOW()
      `,
      [
        "Administrateur BricoMénage",
        email,
        passwordHash,
      ]
    );

    await client.query("COMMIT");

    console.log("Données de démonstration insérées.");
    console.log(`Compte admin : ${email}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Insertion impossible :", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
