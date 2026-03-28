const { execSync } = require("child_process");

console.log("🚀 Starting AutoReelFactory Pipeline...");

try {
  console.log("🎬 Generating prompts...");
  execSync("node generateVideo.js", { stdio: "inherit" });

  console.log("🖼 Generating images...");
  execSync("node generateImages.js", { stdio: "inherit" });

  console.log("🎤 Generating voice...");
  execSync("node generateVoice.js", { stdio: "inherit" });

  console.log("🎥 Creating cinematic video...");
  execSync(`
    ffmpeg -y \
    -loop 1 -t 3 -i ~/ComfyUI/output/scene_1_00001_.png \
    -loop 1 -t 3 -i ~/ComfyUI/output/scene_2_00001_.png \
    -loop 1 -t 3 -i ~/ComfyUI/output/scene_3_00001_.png \
    -loop 1 -t 3 -i ~/ComfyUI/output/scene_4_00001_.png \
    -loop 1 -t 3 -i ~/ComfyUI/output/scene_5_00001_.png \
    -filter_complex "
    [0:v]zoompan=z='min(zoom+0.0015,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=75:s=1080x1920:fps=25[v0];
    [1:v]zoompan=z='min(zoom+0.0015,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=75:s=1080x1920:fps=25[v1];
    [2:v]zoompan=z='min(zoom+0.0015,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=75:s=1080x1920:fps=25[v2];
    [3:v]zoompan=z='min(zoom+0.0015,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=75:s=1080x1920:fps=25[v3];
    [4:v]zoompan=z='min(zoom+0.0015,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=75:s=1080x1920:fps=25[v4];
    [v0][v1][v2][v3][v4]concat=n=5:v=1:a=0,format=yuv420p[v]
    " \
    -map "[v]" \
    -r 25 \
    -t 15 \
    real_cinematic.mp4
  `, { stdio: "inherit", shell: "/bin/bash" });

  console.log("🔊 Merging voice with video...");
  execSync(`
    ffmpeg -y \
    -i real_cinematic.mp4 \
    -i audio/voice.wav \
    -c:v copy \
    -c:a aac \
    -shortest \
    final_video.mp4
  `, { stdio: "inherit", shell: "/bin/bash" });

  console.log("✅ DONE: final_video.mp4");
} catch (error) {
  console.error("❌ Pipeline failed");
  process.exit(1);
}
