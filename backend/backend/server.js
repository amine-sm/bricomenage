require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = Number(
  process.env.PORT || 5000,
);

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET est absent du fichier .env.",
      );
    }

    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(
        `API BricoMénage démarrée sur http://localhost:${PORT}`,
      );

      console.log(
        `Base MySQL : ${process.env.DB_NAME}`,
      );

      console.log(
        "JWT_SECRET chargé : oui",
      );
    });
  } catch (error) {
    console.error(
      "Impossible de démarrer le backend :",
      error.message,
    );

    process.exit(1);
  }
}

startServer();