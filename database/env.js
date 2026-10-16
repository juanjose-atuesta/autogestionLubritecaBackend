const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.join(__dirname, '..');

// Orden: .env (override manual) primero, atlas-credentials.env como respaldo.
['.env', 'atlas-credentials.env'].forEach((file) => {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
});

module.exports = process.env;
