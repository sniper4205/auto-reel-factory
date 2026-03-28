const { db } = require("./db");

db.all(
  "SELECT id, title, status, output_path, created_at FROM projects ORDER BY id DESC",
  [],
  (err, rows) => {
    if (err) {
      console.error("❌ DB Error:", err.message);
      return;
    }

    console.log("\n📂 PROJECT LIST:\n");

    rows.forEach((row) => {
      console.log(
        `${row.id} | ${row.title} | ${row.status} | ${row.output_path}`
      );
    });

    console.log("\n✅ Done\n");
  }
);
