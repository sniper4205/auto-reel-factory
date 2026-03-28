const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

function createProject({ title, story, status, output_path, voice_path, music_path, subtitles_path }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO projects
      (title, story, status, output_path, voice_path, music_path, subtitles_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [title, story, status, output_path, voice_path, music_path, subtitles_path],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

function getAllProjects() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM projects ORDER BY created_at DESC`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  createProject,
  getAllProjects,
};
