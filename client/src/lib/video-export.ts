import type { EditorState, Scene } from "./editor-state";

export interface ExportProgress {
  stage: string;
  percent: number;
}

function getKeptSegments(scene: Scene): { start: number; end: number }[] {
  const trimStart = scene.trim.startTime;
  const trimEnd = scene.trim.endTime;

  const sortedCuts = [...scene.cuts]
    .map(c => ({
      start: Math.max(c.startTime, trimStart),
      end: Math.min(c.endTime, trimEnd),
    }))
    .filter(c => c.end > c.start)
    .sort((a, b) => a.start - b.start);

  if (sortedCuts.length === 0) {
    return [{ start: trimStart, end: trimEnd }];
  }

  const merged: { start: number; end: number }[] = [];
  let current = sortedCuts[0];
  for (let i = 1; i < sortedCuts.length; i++) {
    if (sortedCuts[i].start <= current.end) {
      current = { start: current.start, end: Math.max(current.end, sortedCuts[i].end) };
    } else {
      merged.push(current);
      current = sortedCuts[i];
    }
  }
  merged.push(current);

  const segments: { start: number; end: number }[] = [];
  let pos = trimStart;
  for (const cut of merged) {
    if (cut.start > pos) {
      segments.push({ start: pos, end: cut.start });
    }
    pos = cut.end;
  }
  if (pos < trimEnd) {
    segments.push({ start: pos, end: trimEnd });
  }

  return segments;
}

function buildVideoFilters(state: EditorState, scene: Scene): string[] {
  const parts: string[] = [];

  if (state.filters.brightness !== 100 || state.filters.contrast !== 100 || state.filters.saturation !== 100) {
    const b = (state.filters.brightness - 100) / 200;
    const c = state.filters.contrast / 100;
    const s = state.filters.saturation / 100;
    parts.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}`);
  }

  if (state.filters.preset === "grayscale") {
    parts.push("hue=s=0");
  }
  if (state.filters.preset === "sepia") {
    parts.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
  }

  for (const overlay of scene.textOverlays) {
    const escapedText = overlay.text.replace(/'/g, "'\\''").replace(/:/g, "\\\\:");
    const y = overlay.position === "top" ? "50" : overlay.position === "center" ? "(h-text_h)/2" : "h-text_h-50";
    parts.push(
      `drawtext=text='${escapedText}':fontsize=${overlay.fontSize}:fontcolor=${overlay.color}:x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.7:boxborderw=5:enable='between(t\\,${overlay.startTime}\\,${overlay.endTime})'`
    );
  }

  return parts;
}

async function processScene(
  ffmpeg: any,
  fetchFile: any,
  scene: Scene,
  sceneIndex: number,
  state: EditorState,
  onProgress: (progress: ExportProgress) => void,
  progressBase: number,
  progressRange: number,
): Promise<string> {
  const inputName = `input_${sceneIndex}.mp4`;
  const outputName = `scene_${sceneIndex}.mp4`;

  onProgress({ stage: `Loading scene ${sceneIndex + 1}: ${scene.name}...`, percent: progressBase });

  let videoData: Uint8Array;
  try {
    const videoUrl = scene.videoUrl.startsWith("/")
      ? `${window.location.origin}${scene.videoUrl}`
      : scene.videoUrl;
    videoData = await fetchFile(videoUrl);
  } catch (err) {
    throw new Error(`Could not load video for "${scene.name}". The file may have been deleted.`);
  }
  await ffmpeg.writeFile(inputName, videoData);

  const segments = getKeptSegments(scene);
  const videoFilters = buildVideoFilters(state, scene);
  const hasCuts = scene.cuts.length > 0 && segments.length > 1;

  if (hasCuts) {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segArgs: string[] = ["-i", inputName, "-ss", seg.start.toString(), "-to", seg.end.toString()];
      if (videoFilters.length > 0) segArgs.push("-vf", videoFilters.join(","));
      if (scene.volume !== 1) segArgs.push("-af", `volume=${scene.volume}`);
      segArgs.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "-y", `seg_${sceneIndex}_${i}.mp4`);
      try {
        await ffmpeg.exec(segArgs);
      } catch {
        await ffmpeg.exec(["-i", inputName, "-ss", seg.start.toString(), "-to", seg.end.toString(), "-c", "copy", "-y", `seg_${sceneIndex}_${i}.mp4`]);
      }
      const pct = progressBase + Math.round((i / segments.length) * progressRange * 0.7);
      onProgress({ stage: `Rendering scene ${sceneIndex + 1}, part ${i + 1}/${segments.length}...`, percent: pct });
    }

    const concatList = segments.map((_, i) => `file 'seg_${sceneIndex}_${i}.mp4'`).join("\n");
    await ffmpeg.writeFile(`concat_${sceneIndex}.txt`, new TextEncoder().encode(concatList));
    await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", `concat_${sceneIndex}.txt`, "-c", "copy", "-y", outputName]);
  } else {
    const args: string[] = ["-i", inputName, "-ss", scene.trim.startTime.toString(), "-to", scene.trim.endTime.toString()];
    if (videoFilters.length > 0) args.push("-vf", videoFilters.join(","));
    if (scene.volume !== 1) args.push("-af", `volume=${scene.volume}`);
    args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "-y", outputName);
    try {
      await ffmpeg.exec(args);
    } catch {
      await ffmpeg.exec(["-i", inputName, "-ss", scene.trim.startTime.toString(), "-to", scene.trim.endTime.toString(), "-c", "copy", "-y", outputName]);
    }
  }

  onProgress({ stage: `Scene ${sceneIndex + 1} done`, percent: progressBase + progressRange });
  return outputName;
}

export async function exportVideo(
  _primaryVideoUrl: string,
  state: EditorState,
  onProgress: (progress: ExportProgress) => void
): Promise<Blob> {
  onProgress({ stage: "Initializing export engine...", percent: 5 });

  let FFmpeg: any, fetchFile: any, toBlobURL: any;
  try {
    const ffmpegMod = await import("@ffmpeg/ffmpeg");
    const utilMod = await import("@ffmpeg/util");
    FFmpeg = ffmpegMod.FFmpeg;
    fetchFile = utilMod.fetchFile;
    toBlobURL = utilMod.toBlobURL;
  } catch (err) {
    throw new Error("Failed to load export engine. Please refresh the page and try again.");
  }

  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }: { progress: number }) => {
    const pct = Math.min(Math.round(progress * 100), 95);
    onProgress({ stage: "Rendering video...", percent: Math.max(pct, 10) });
  });

  try {
    onProgress({ stage: "Loading FFmpeg (downloading core)...", percent: 8 });
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    onProgress({ stage: "FFmpeg ready", percent: 12 });

    const sceneCount = state.scenes.length;
    const progressPerScene = Math.floor(70 / sceneCount);
    const sceneOutputs: string[] = [];

    for (let i = 0; i < sceneCount; i++) {
      const scene = state.scenes[i];
      const progressBase = 15 + i * progressPerScene;
      const output = await processScene(ffmpeg, fetchFile, scene, i, state, onProgress, progressBase, progressPerScene);
      sceneOutputs.push(output);
    }

    let finalOutput: string;
    if (sceneOutputs.length > 1) {
      onProgress({ stage: "Joining all scenes...", percent: 88 });
      const concatList = sceneOutputs.map(name => `file '${name}'`).join("\n");
      await ffmpeg.writeFile("final_concat.txt", new TextEncoder().encode(concatList));
      await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "final_concat.txt", "-c", "copy", "-y", "output.mp4"]);
      finalOutput = "output.mp4";
    } else {
      finalOutput = sceneOutputs[0];
    }

    onProgress({ stage: "Finalizing...", percent: 95 });
    const outputData = await ffmpeg.readFile(finalOutput);
    const blob = new Blob([outputData], { type: "video/mp4" });
    onProgress({ stage: "Complete!", percent: 100 });
    return blob;
  } finally {
    try { ffmpeg.terminate(); } catch {}
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
