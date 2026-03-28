const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../db/database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      story TEXT,
      status TEXT,
      output_path TEXT,
      voice_path TEXT,
      music_path TEXT,
      subtitles_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Projects table ready");
});

db.close((err) => {
  if (err) {
    console.error("❌ Error closing database:", err.message);
  } else {
    console.log("✅ Database setup complete");
  }
});
