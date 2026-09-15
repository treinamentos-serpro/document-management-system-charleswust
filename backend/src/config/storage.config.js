const path = require('node:path');

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));

module.exports = {
  STORAGE_DIR,
};
