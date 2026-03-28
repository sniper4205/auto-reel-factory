const { db } = require("./db");
const { exec } = require("child_process");

const projectId = process.argv[2];

if (!projectId) {
  console.log("❌ Please provide project ID");
  console.log("Example: node openProject.js 2");
  process.exit(1);
}

db.get(
  "SELECT output_path FROM projects WHERE id = ?",
  [projectId],
  (err, row) => {
    if (err) {
      console.error("❌ DB Error:", err.message);
      return;
    }

    if (!row) {
      console.log("❌ Project not found");
      return;
    }

    console.log("🎬 Opening video:", row.output_path);

    exec(`open "${row.output_path}"`);
  }
);
