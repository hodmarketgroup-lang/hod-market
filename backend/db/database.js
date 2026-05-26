const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, '..', 'centrale.db'),
  (err) => {
    if (err) console.error('❌ Erreur connexion DB:', err.message);
    else console.log('✅ Connecté à centrale.db');
  }
);

db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

module.exports = db;