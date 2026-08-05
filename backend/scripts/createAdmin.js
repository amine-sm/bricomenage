require("dotenv").config();

const bcrypt = require("bcryptjs");

const pool = require("../config/db");

async function createAdmin() {
  const email =
    "admin@bricomenage.dz";

  const password =
    "Admin@123";

  const name =
    "Administrateur BricoMénage";

  try {
    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    await pool.query(
      `
        INSERT INTO admins (
          name,
          email,
          password_hash,
          is_active
        )
        VALUES (?, ?, ?, 1)

        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        name,
        email,
        passwordHash,
      ],
    );

    console.log(
      "Administrateur créé avec succès.",
    );

    console.log(
      `E-mail : ${email}`,
    );

    console.log(
      `Mot de passe : ${password}`,
    );
  } catch (error) {
    console.error(
      "Erreur lors de la création de l’administrateur :",
      error.message,
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();