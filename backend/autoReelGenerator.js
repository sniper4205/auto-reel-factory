const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { execSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT_DIR, "db", "database.sqlite");
const OUTPUTS_DIR = path.join(ROOT_DIR, "outputs", "projects");
const MUSIC_DIR = path.join(__dirname, "audio", "music");

fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

function getProjectById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
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

function safeName(text) {
  return String(text || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50) || "project";
}

function splitStoryIntoScenes(story) {
  const cleaned = String(story || "").trim();
  if (!cleaned) return ["A cinematic scene."];

  return cleaned
    .split(/[\.\!\?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function wrapSubtitleText(text, maxLen = 18) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;

    if (next.length <= maxLen) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }

    if (lines.length === 2) break;
  }

  if (line && lines.length < 2) lines.push(line);

  return lines.join("\\N");
}

function createSubtitlesFile(scenes, outPath, secondsPerScene) {
  let srt = "";
  let start = 0;

  scenes.forEach((scene, index) => {
    const end = start + secondsPerScene;

    const fmt = (n) => {
      const hrs = String(Math.floor(n / 3600)).padStart(2, "0");
      const mins = String(Math.floor((n % 3600) / 60)).padStart(2, "0");
      const secs = String(Math.floor(n % 60)).padStart(2, "0");
      return `${hrs}:${mins}:${secs},000`;
    };

    srt += `${index + 1}\n`;
    srt += `${fmt(start)} --> ${fmt(end)}\n`;
    srt += `${wrapSubtitleText(scene.toUpperCase())}\n\n`;

    start = end;
  });

  fs.writeFileSync(outPath, srt, "utf-8");
}

function pickMusicFile(project) {
  if (project.music_path) {
    const maybeAbs = project.music_path;
    const maybeRel = path.join(ROOT_DIR, project.music_path);

    if (fs.existsSync(maybeAbs)) return maybeAbs;
    if (fs.existsSync(maybeRel)) return maybeRel;
  }

  const mp3s = fs
    .readdirSync(MUSIC_DIR)
    .filter((f) => f.toLowerCase().endsWith(".mp3"))
    .sort();

  if (!mp3s.length) return null;
  return path.join(MUSIC_DIR, mp3s[0]);
}

function createImage(text, outFile) {
  const prompt = text.replace(/"/g, "");

  const cmd = `~/AutoReelFactory/ai/venv/bin/python ~/AutoReelFactory/ai/generate_image.py "${prompt}" "${outFile}" 1234`;
  execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });

  if (!fs.existsSync(outFile)) {
    throw new Error("Image file not created");
  }
}

function createVoice(text, outFile) {
  const clean = text.replace(/"/g, "");

  const cmd = `~/AutoReelFactory/ai/venv/bin/python ~/AutoReelFactory/ai/generate_voice.py "${clean}" "${outFile}"`;
  execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });

  if (!fs.existsSync(outFile)) {
    throw new Error("Voice file not created");
  }
}

function createClip(image, duration, out) {
  const cmd = `ffmpeg -y -loop 1 -i "${image}" -t ${duration} -vf "scale=1080:1920,zoompan=z='min(zoom+0.0008,1.08)':d=90:s=1080x1920,format=yuv420p" -r 30 -pix_fmt yuv420p "${out}"`;
  execSync(cmd, { stdio: "ignore" });
}

function concatClips(listFile, out) {
  const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${out}"`;
  execSync(cmd, { stdio: "ignore" });
}

function getAudioDuration(file) {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`;
  const output = execSync(cmd, { encoding: "utf8" }).trim();
  const duration = parseFloat(output);
  return Number.isFinite(duration) ? duration : 0;
}

function addAudio(video, voice, music, out) {
  if (!fs.existsSync(voice)) {
    throw new Error("Voice file missing before merge");
  }

  if (music && fs.existsSync(music)) {
    const cmd = `ffmpeg -y -i "${video}" -i "${voice}" -i "${music}" -filter_complex "[1:a]volume=1.4[a1];[2:a]volume=0.10[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -shortest -c:v copy -c:a aac -b:a 192k "${out}"`;
    execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
  } else {
    const cmd = `ffmpeg -y -i "${video}" -i "${voice}" -map 0:v -map 1:a -shortest -c:v copy -c:a aac -b:a 192k "${out}"`;
    execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
  }

  if (!fs.existsSync(out)) {
    throw new Error("Audio merge failed");
  }
}

function burnSubtitles(videoFile, srtFile, outFile) {
  const safeSrt = srtFile.replace(/\\/g, "/").replace(/:/g, "\\:");
  const cmd = `ffmpeg -y -i "${videoFile}" -vf "subtitles='${safeSrt}':force_style='FontName=Arial,FontSize=14,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Alignment=2,MarginV=80'" -c:a copy "${outFile}"`;
  execSync(cmd, { stdio: "ignore" });
}

async function main() {
  const projectId = Number(process.env.PROJECT_ID);
  if (!projectId) throw new Error("PROJECT_ID missing");

  const project = await getProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const title = project.title || "Project";
  const scenes = splitStoryIntoScenes(project.story || "");
  const folder = path.join(OUTPUTS_DIR, `project_${projectId}_${safeName(title)}`);
  fs.mkdirSync(folder, { recursive: true });

  await updateProject(projectId, {
    progress: 10,
    status: "generating",
    current_step: "images",
    message: "Generating images",
  });

  const imageFiles = [];
  const clipFiles = [];

  for (let i = 0; i < scenes.length; i++) {
    const img = path.join(folder, `img_${i}.png`);
    const clip = path.join(folder, `clip_${i}.mp4`);

    let baseStyle = "cinematic shot, ultra realistic, 8k, highly detailed, sharp focus, professional photography, depth of field, dramatic lighting";

     if (project.style === "realistic") {
      baseStyle = "ultra realistic, 8k, DSLR photo, natural lighting, high detail, sharp focus";
}

      if (project.style === "anime") {
      baseStyle = "anime style, studio ghibli style, vibrant colors, highly detailed, 4k";
}

      if (project.style === "3d") {
      baseStyle = "3d render, octane render, unreal engine, cinematic lighting, ultra detailed";
}

const cinematicPrompt = `${baseStyle}, ${scenes[i]}`;
    createImage(cinematicPrompt, img);

    imageFiles.push(img);
    clipFiles.push(clip);
  }

  await updateProject(projectId, {
    progress: 35,
    current_step: "voice",
    message: "Generating voiceover",
  });

  const voice = path.join(folder, "voice.mp3");
  createVoice(project.story || title, voice);

  const voiceDuration = getAudioDuration(voice);
  const safeDuration = voiceDuration > 0 ? voiceDuration : 6;
  const sceneDuration = Math.max(2.5, safeDuration / Math.max(1, scenes.length));

  for (let i = 0; i < scenes.length; i++) {
    createClip(imageFiles[i], sceneDuration, clipFiles[i]);
  }

  await updateProject(projectId, {
    progress: 55,
    current_step: "video",
    message: "Building video scenes",
  });

  const list = path.join(folder, "list.txt");
  fs.writeFileSync(list, clipFiles.map((c) => `file '${c}'`).join("\n"));

  const silentVideo = path.join(folder, "video.mp4");
  concatClips(list, silentVideo);

  await updateProject(projectId, {
    progress: 70,
    current_step: "audio",
    message: "Mixing voice and music",
  });

  const music = pickMusicFile(project);
  const withAudio = path.join(folder, "audio.mp4");
  addAudio(silentVideo, voice, music, withAudio);

  await updateProject(projectId, {
    progress: 85,
    current_step: "subtitles",
    message: "Adding subtitles",
  });

  const srt = path.join(folder, "subs.srt");
  createSubtitlesFile(scenes, srt, sceneDuration);

  const final = path.join(folder, "final.mp4");
  burnSubtitles(withAudio, srt, final);

  await updateProject(projectId, {
    progress: 100,
    status: "completed",
    current_step: "completed",
    message: "Project completed",
    output_path: final,
    voice_path: voice,
    music_path: music,
    subtitles_path: srt,
    error: null,
  });

  console.log("DONE");
}

main()
  .then(() => db.close())
  .catch(async (err) => {
    console.error(err.message || err);

    const projectId = Number(process.env.PROJECT_ID || 0);
    if (projectId) {
      try {
        await updateProject(projectId, {
          status: "failed",
          progress: 0,
          current_step: "failed",
          message: "Generation failed",
          error: err.message || String(err),
        });
      } catch {}
    }

    db.close();
    process.exit(1);
  });
