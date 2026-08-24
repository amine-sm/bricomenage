require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function run() {
  try {
    const email = String(
      process.env.ADMIN_EMAIL || "admin@bricomenage.dz"
    )
      .trim()
      .toLowerCase();

    const password = String(
      process.env.ADMIN_PASSWORD || "Admin@123"
    );

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `
        INSERT INTO admins (
          name, email, password_hash, is_active, role
        )
        VALUES (?, ?, ?, 1, 'SUPER_ADMIN')
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash),
          is_active = 1,
          role = 'SUPER_ADMIN'
      `,
      [
        "Administrateur BricoMénage",
        email,
        passwordHash,
      ]
    );

    console.log("Compte administrateur créé.");
    console.log(`E-mail : ${email}`);
  } catch (error) {
    console.error("Création admin impossible :", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
