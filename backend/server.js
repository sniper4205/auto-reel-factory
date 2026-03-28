const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const { spawn } = require("child_process");

const app = express();
const PORT = 5050;

const ROOT_DIR = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT_DIR, "db", "database.sqlite");
const MUSIC_DIR = path.join(__dirname, "audio", "music");
const PROJECTS_DIR = path.join(ROOT_DIR, "outputs", "projects");
const STORY_PATH = path.join(__dirname, "story.txt");

fs.mkdirSync(MUSIC_DIR, { recursive: true });
fs.mkdirSync(PROJECTS_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ DB open error:", err.message);
  } else {
    console.log("✅ SQLite connected");
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
      progress INTEGER DEFAULT 0,
      current_step TEXT DEFAULT 'queued',
      message TEXT DEFAULT '',
      error TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const extraColumns = [
    "ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN current_step TEXT DEFAULT 'queued'",
    "ALTER TABLE projects ADD COLUMN message TEXT DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN error TEXT DEFAULT NULL",
  ];

  extraColumns.forEach((sql) => {
    db.run(sql, () => {});
  });
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use("/music", express.static(MUSIC_DIR));
app.use("/videos", express.static(PROJECTS_DIR));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, MUSIC_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAllProjects() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM projects ORDER BY id DESC`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getProjectById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM projects WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

async function updateProject(id, data) {
  const keys = Object.keys(data);
  if (!keys.length) return;

  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => data[k]);
  values.push(id);

  await runQuery(`UPDATE projects SET ${setClause} WHERE id = ?`, values);
}

function mapProjectVideoUrl(project) {
  let video_url = null;

  if (project.output_path) {
    const normalized = project.output_path.replace(/\\/g, "/");
    const marker = "/outputs/projects/";
    const idx = normalized.indexOf(marker);

    if (idx !== -1) {
      const relativePath = normalized.substring(idx + marker.length);
      video_url = `http://localhost:${PORT}/videos/${relativePath}`;
    }
  }

  return {
    ...project,
    video_url,
  };
}

function getMusicFiles() {
  const files = fs.existsSync(MUSIC_DIR)
    ? fs.readdirSync(MUSIC_DIR).filter((f) => f.toLowerCase().endsWith(".mp3"))
    : [];

  return files.map((file) => ({
    name: file,
    url: `http://localhost:${PORT}/music/${encodeURIComponent(file)}`,
  }));
}

function walkFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      walkFiles(fullPath, list);
    } else {
      list.push(fullPath);
    }
  }
  return list;
}

function findLatestMp4File() {
  const files = walkFiles(PROJECTS_DIR).filter((f) => f.toLowerCase().endsWith(".mp4"));
  if (!files.length) return null;

  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

async function startBackgroundGeneration(projectId, payload) {
  try {
    await updateProject(projectId, {
      status: "generating",
      progress: 5,
      current_step: "starting",
      message: "Starting generation...",
      error: null,
    });

    fs.writeFileSync(STORY_PATH, (payload.story || "").trim(), "utf-8");

    const child = spawn("node", ["autoReelGenerator.js"], {
      cwd: __dirname,
      env: {
        ...process.env,
        PROJECT_TITLE: payload.title || "",
        MUSIC_FILE: payload.musicFile || "",
        VOICE_NAME: payload.voiceName || "",
        SUBTITLES_ENABLED: String(payload.subtitlesEnabled ?? true),
        PROJECT_ID: String(projectId),
        STYLE: payload.style || "cinematic",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", async (data) => {
      const text = data.toString();
      process.stdout.write(text);

      try {
        if (text.includes("Project folder")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 10,
            current_step: "project_folder",
            message: "Creating project folder...",
          });
        } else if (text.includes("Creating cinematic video")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 25,
            current_step: "video",
            message: "Creating cinematic video...",
          });
        } else if (text.includes("Generating voice")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 45,
            current_step: "voice",
            message: "Generating voice...",
          });
        } else if (text.includes("Selected music")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 60,
            current_step: "music_select",
            message: "Selecting music...",
          });
        } else if (text.includes("Mixing background music")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 70,
            current_step: "music",
            message: "Mixing background music...",
          });
        } else if (text.includes("Burning subtitles")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 85,
            current_step: "subtitles",
            message: "Adding subtitles...",
          });
        } else if (text.includes("DONE")) {
          await updateProject(projectId, {
            status: "generating",
            progress: 95,
            current_step: "finalizing",
            message: "Finalizing project...",
          });
        }
      } catch (e) {
        console.error("Progress update error:", e.message);
      }
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    child.on("close", async (code) => {
      try {
        if (code !== 0) {
          await updateProject(projectId, {
            status: "failed",
            progress: 0,
            current_step: "failed",
            message: "Generation failed",
            error: `Exit code ${code}`,
          });
          return;
        }

        const latestMp4 = findLatestMp4File();

        await updateProject(projectId, {
          status: "completed",
          progress: 100,
          current_step: "completed",
          message: "Project completed",
          error: null,
          output_path: latestMp4 || null,
          music_path: payload.musicFile ? path.join("audio", "music", payload.musicFile) : null,
          voice_path: payload.voiceName || null,
          subtitles_path: payload.subtitlesEnabled === false ? null : "subtitles.srt",
        });
      } catch (e) {
        console.error("Close handler error:", e.message);
      }
    });
  } catch (error) {
    console.error("Background generation error:", error.message);
    await updateProject(projectId, {
      status: "failed",
      progress: 0,
      current_step: "failed",
      message: "Generation failed",
      error: error.message,
    });
  }
}

async function createProjectHandler(req, res) {
  const payload = req.body || {};
  const story = payload.story || payload.script || "";
  const title = payload.title || "Auto Reel Project";

  if (!story.trim()) {
    return res.status(400).json({ error: "Story is required" });
  }

  try {
    const result = await runQuery(
      `INSERT INTO projects (
        title, story, status, output_path, voice_path, music_path, subtitles_path,
        progress, current_step, message, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        story.trim(),
        "queued",
        null,
        payload.voice || payload.voiceName || null,
        payload.music === "none" ? null : (payload.music || payload.musicFile || null),
        payload.subtitles === false || payload.subtitlesEnabled === false ? null : "subtitles.srt",
        0,
        "queued",
        "Queued for generation",
        null,
      ]
    );

    const projectId = result.lastID;

    startBackgroundGeneration(projectId, {
      title,
      story,
      musicFile: payload.music === "none" ? "" : (payload.music || payload.musicFile || ""),
      voiceName: payload.voice || payload.voiceName || "",
      subtitlesEnabled: payload.subtitlesEnabled ?? payload.subtitles ?? true,
      style: payload.style || "cinematic",
    });

    res.json({
      ok: true,
      projectId,
      message: "Project created and generation started",
    });
  } catch (error) {
    console.error("❌ create project error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Auto Reel Factory backend running" });
});

app.get("/status", async (req, res) => {
  try {
    const projects = await getAllProjects();
    const active = projects.find((p) => p.status === "generating") || null;

    res.json(
      active
        ? {
            status: active.status,
            progress: active.progress || 0,
            current_step: active.current_step || "idle",
            message: active.message || "",
            error: active.error || null,
            project_id: active.id,
          }
        : {
            status: "idle",
            progress: 0,
            current_step: "idle",
            message: "",
            error: null,
            project_id: null,
          }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to load status" });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const projects = await getAllProjects();
    const musicFiles = getMusicFiles();

    res.json({
      totalProjects: projects.length,
      totalVideos: projects.filter((p) => p.status === "completed").length,
      totalMusic: musicFiles.length,
      musicFiles: musicFiles.map((m) => m.name),
      totalVoices: 1,
    });
  } catch (error) {
    console.error("❌ /stats error:", error.message);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

app.get("/music-files", (req, res) => {
  try {
    res.json(getMusicFiles());
  } catch (error) {
    console.error("❌ /music-files error:", error.message);
    res.status(500).json({ error: "Failed to list music files" });
  }
});

app.get("/projects", async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects.map(mapProjectVideoUrl));
  } catch (error) {
    console.error("❌ /projects error:", error.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects.map(mapProjectVideoUrl));
  } catch (error) {
    console.error("❌ /api/projects error:", error.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.post("/upload-music", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({ ok: true, filename: req.file.filename });
  } catch (error) {
    console.error("❌ /upload-music error:", error.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/create-project", createProjectHandler);
app.post("/project", createProjectHandler);
app.post("/projects", createProjectHandler);
app.post("/api/projects", createProjectHandler);

app.delete("/project/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM projects WHERE id = ?", [id], (err, project) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    if (!project) {
      return res.json({ ok: true });
    }

    if (project.output_path && fs.existsSync(project.output_path)) {
      try {
        fs.unlinkSync(project.output_path);
      } catch (e) {
        console.error("File delete error:", e);
      }
    }

    db.run("DELETE FROM projects WHERE id = ?", [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Delete failed" });
      }

      res.json({ ok: true });
    });
  });
});

app.delete("/api/project/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM projects WHERE id = ?", [id], (err, project) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    if (!project) {
      return res.json({ ok: true });
    }

    if (project.output_path && fs.existsSync(project.output_path)) {
      try {
        fs.unlinkSync(project.output_path);
      } catch (e) {
        console.error("File delete error:", e);
      }
    }

    db.run("DELETE FROM projects WHERE id = ?", [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Delete failed" });
      }

      res.json({ ok: true });
    });
  });
});

app.put("/project/:id", (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  db.run(
    "UPDATE projects SET title = ? WHERE id = ?",
    [title.trim(), id],
    function (err) {
      if (err) {
        console.error("❌ Rename error:", err);
        return res.status(500).json({ error: "Rename failed" });
      }

      res.json({ ok: true });
    }
  );
});

app.put("/api/project/:id", (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  db.run(
    "UPDATE projects SET title = ? WHERE id = ?",
    [title.trim(), id],
    function (err) {
      if (err) {
        console.error("❌ Rename error:", err);
        return res.status(500).json({ error: "Rename failed" });
      }

      res.json({ ok: true });
    }
  );
});

process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ unhandledRejection:", err);
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("❌ listen error:", err);
});
