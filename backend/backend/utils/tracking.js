const { v4: uuidv4 } = require("uuid");

function createTrackingNumber() {
  const year = new Date().getFullYear();
  const code = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `BRICO-${year}-${code}`;
}

module.exports = { createTrackingNumber };
