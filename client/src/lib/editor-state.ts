export interface TrimState {
  startTime: number;
  endTime: number;
}

export interface CutSegment {
  id: string;
  startTime: number;
  endTime: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "center" | "bottom";
  fontSize: number;
  color: string;
  backgroundColor: string;
  fontWeight: "normal" | "bold";
}

export interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  preset: "none" | "grayscale" | "sepia" | "warm" | "cool" | "vintage";
}

export interface Scene {
  id: string;
  name: string;
  videoUrl: string;
  duration: number;
  trim: TrimState;
  cuts: CutSegment[];
  volume: number;
  textOverlays: TextOverlay[];
}

export interface EditorState {
  scenes: Scene[];
  activeSceneIndex: number;
  filters: FilterSettings;
  totalDuration: number;
}

export function createInitialScene(videoUrl: string, duration: number, name?: string): Scene {
  return {
    id: generateId(),
    name: name || "Scene 1",
    videoUrl,
    duration,
    trim: { startTime: 0, endTime: duration },
    cuts: [],
    volume: 1,
    textOverlays: [],
  };
}

export function createInitialEditorState(videoUrl: string, duration: number): EditorState {
  const scene = createInitialScene(videoUrl, duration, "Scene 1");
  return {
    scenes: [scene],
    activeSceneIndex: 0,
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      preset: "none",
    },
    totalDuration: duration,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getFilterCssString(filters: FilterSettings): string {
  const parts: string[] = [];

  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);

  switch (filters.preset) {
    case "grayscale":
      parts.push("grayscale(100%)");
      break;
    case "sepia":
      parts.push("sepia(80%)");
      break;
    case "warm":
      parts.push("sepia(30%) saturate(140%)");
      break;
    case "cool":
      parts.push("hue-rotate(30deg) saturate(80%)");
      break;
    case "vintage":
      parts.push("sepia(40%) contrast(90%) brightness(90%)");
      break;
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

export function isTimeInCut(time: number, cuts: CutSegment[]): boolean {
  return cuts.some((cut) => time >= cut.startTime && time <= cut.endTime);
}

export function getSceneEffectiveDuration(scene: Scene): number {
  const trimDuration = scene.trim.endTime - scene.trim.startTime;
  const cutDuration = scene.cuts.reduce((total, cut) => {
    const cutStart = Math.max(cut.startTime, scene.trim.startTime);
    const cutEnd = Math.min(cut.endTime, scene.trim.endTime);
    if (cutEnd > cutStart) {
      return total + (cutEnd - cutStart);
    }
    return total;
  }, 0);
  return trimDuration - cutDuration;
}

export function getTotalEffectiveDuration(state: EditorState): number {
  return state.scenes.reduce((total, scene) => total + getSceneEffectiveDuration(scene), 0);
}

export function getActiveScene(state: EditorState): Scene | null {
  return state.scenes[state.activeSceneIndex] || null;
}

export function getSceneTimelineOffset(state: EditorState, sceneIndex: number): number {
  let offset = 0;
  for (let i = 0; i < sceneIndex && i < state.scenes.length; i++) {
    offset += getSceneEffectiveDuration(state.scenes[i]);
  }
  return offset;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
}
