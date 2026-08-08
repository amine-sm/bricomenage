const mysql = require("mysql2/promise");

function systemTimeZoneOffset() {
  const totalMinutes =
    -new Date().getTimezoneOffset();

  const sign =
    totalMinutes >= 0
      ? "+"
      : "-";

  const absolute =
    Math.abs(totalMinutes);

  const hours =
    String(
      Math.floor(
        absolute / 60,
      ),
    ).padStart(2, "0");

  const minutes =
    String(
      absolute % 60,
    ).padStart(2, "0");

  return `${sign}${hours}:${minutes}`;
}

const dbTimeZone =
  String(
    process.env.DB_TIMEZONE ||
      systemTimeZoneOffset(),
  ).trim();

const pool = mysql.createPool({
  host:
    process.env.DB_HOST ||
    "localhost",

  port: Number(
    process.env.DB_PORT ||
      3306,
  ),

  user:
    process.env.DB_USER ||
    "root",

  password:
    process.env.DB_PASSWORD ||
    "",

  database:
    process.env.DB_NAME ||
    "bricomenage",

  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true,

  /*
   * Les DATETIME renvoyés par mysql2
   * sont interprétés avec le fuseau
   * horaire du PC qui exécute Node.js.
   */
  timezone: dbTimeZone,
});

/*
 * IMPORTANT :
 * Chaque nouvelle connexion MySQL
 * reçoit le même fuseau horaire que
 * le système du PC / serveur Node.
 *
 * Donc NOW(), CURRENT_TIMESTAMP,
 * created_at, updated_at, historique,
 * commandes, promotions, etc.
 * utilisent tous la même heure locale.
 */
pool.on(
  "connection",
  (connection) => {
    connection.query(
      "SET time_zone = ?",
      [dbTimeZone],
      (error) => {
        if (error) {
          console.warn(
            "[DB] Impossible d'appliquer le fuseau horaire système :",
            error.message,
          );
        }
      },
    );
  },
);

console.log(
  `[DB] Fuseau horaire système utilisé : ${dbTimeZone}`,
);

module.exports = pool;
