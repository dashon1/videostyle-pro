import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Pause, SkipBack, SkipForward, Scissors, Type,
  SlidersHorizontal, Volume2, VolumeX, Download, ArrowLeft,
  Undo2, Redo2, Plus, Trash2, X, Film, GripVertical,
  ChevronUp, ChevronDown, Upload
} from "lucide-react";
import type { Project } from "@shared/schema";
import {
  createInitialEditorState,
  createInitialScene,
  generateId,
  getFilterCssString,
  formatTime,
  getTotalEffectiveDuration,
  getSceneEffectiveDuration,
  getActiveScene,
  isTimeInCut,
  type EditorState,
  type TextOverlay,
  type FilterSettings,
  type CutSegment,
  type Scene,
} from "@/lib/editor-state";
import { downloadBlob, type ExportProgress } from "@/lib/video-export";

type ActiveTool = "trim" | "text" | "filters" | "scenes" | null;

export default function VideoEditor() {
  const params = useParams();
  const projectId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const addClipInputRef = useRef<HTMLInputElement>(null);
  const editorStateRef = useRef<EditorState | null>(null);
  const trimDragRef = useRef<{
    sceneIndex: number;
    handle: "start" | "end";
    startX: number;
    startValue: number;
    sceneDuration: number;
    scenePxWidth: number;
  } | null>(null);

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState<ActiveTool>("scenes");
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [addingClip, setAddingClip] = useState(false);
  const pendingPlaybackRef = useRef(false);

  const [newText, setNewText] = useState("");

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const videoUrl = projectId ? `/api/projects/${projectId}/video` : null;

  useEffect(() => {
    if (project && !editorState && videoUrl) {
      const duration = project.duration || 60;
      const initial = createInitialEditorState(videoUrl, duration);
      setEditorState(initial);
      setHistory([initial]);
      setHistoryIndex(0);
    }
  }, [project, editorState, videoUrl]);

  const pushState = useCallback((newState: EditorState) => {
    setEditorState(newState);
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditorState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditorState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const activeScene = editorState ? getActiveScene(editorState) : null;

  useEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;
    const realDuration = video.duration;
    const state = editorStateRef.current;
    if (!state) return;
    const scene = state.scenes[state.activeSceneIndex];
    if (!scene) return;
    if (Math.abs(scene.duration - realDuration) > 0.5) {
      const updatedScenes = [...state.scenes];
      const existingTrimEnd = scene.trim.endTime;
      updatedScenes[state.activeSceneIndex] = {
        ...scene,
        duration: realDuration,
        trim: {
          startTime: Math.min(scene.trim.startTime, realDuration),
          endTime: existingTrimEnd > scene.duration - 0.5 ? realDuration : Math.min(existingTrimEnd, realDuration),
        },
      };
      const updated = { ...state, scenes: updatedScenes };
      editorStateRef.current = updated;
      setEditorState(updated);
      video.currentTime = Math.min(scene.trim.startTime, realDuration);
    }
  };

  const startTrimDrag = (sceneIndex: number, handle: "start" | "end", e: React.MouseEvent) => {
    const state = editorStateRef.current;
    if (!state || !timelineRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const scene = state.scenes[sceneIndex];
    const rect = timelineRef.current.getBoundingClientRect();
    const totalDur = state.scenes.reduce((t, s) => t + s.duration, 0);
    const scenePxWidth = totalDur > 0 ? (scene.duration / totalDur) * rect.width : rect.width;
    trimDragRef.current = {
      sceneIndex,
      handle,
      startX: e.clientX,
      startValue: handle === "start" ? scene.trim.startTime : scene.trim.endTime,
      sceneDuration: scene.duration,
      scenePxWidth,
    };

    const onMove = (ev: MouseEvent) => {
      const drag = trimDragRef.current;
      const cur = editorStateRef.current;
      if (!drag || !cur) return;
      const dx = ev.clientX - drag.startX;
      const dSec = (dx / drag.scenePxWidth) * drag.sceneDuration;
      const newVal = Math.max(0, Math.min(drag.sceneDuration, drag.startValue + dSec));
      const scene = cur.scenes[drag.sceneIndex];
      const updatedScenes = [...cur.scenes];
      let seekTime = newVal;
      if (drag.handle === "start") {
        const clamped = Math.min(newVal, scene.trim.endTime - 0.5);
        updatedScenes[drag.sceneIndex] = { ...scene, trim: { ...scene.trim, startTime: clamped } };
        seekTime = clamped;
      } else {
        const clamped = Math.max(newVal, scene.trim.startTime + 0.5);
        updatedScenes[drag.sceneIndex] = { ...scene, trim: { ...scene.trim, endTime: clamped } };
        seekTime = clamped;
      }
      const next = { ...cur, scenes: updatedScenes };
      editorStateRef.current = next;
      setEditorState(next);
      if (drag.sceneIndex === cur.activeSceneIndex && videoRef.current) {
        videoRef.current.currentTime = seekTime;
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const finalState = editorStateRef.current;
      if (finalState) {
        setHistory(prev => {
          const trimmed = prev.slice(0, historyIndex + 1);
          return [...trimmed, finalState];
        });
        setHistoryIndex(prev => prev + 1);
      }
      trimDragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      if (activeScene && isTimeInCut(time, activeScene.cuts)) {
        const nextValidTime = activeScene.cuts
          .filter(c => time >= c.startTime && time <= c.endTime)
          .reduce((max, c) => Math.max(max, c.endTime), time);
        video.currentTime = nextValidTime + 0.01;
      }
      if (activeScene && time >= activeScene.trim.endTime) {
        if (editorState && editorState.activeSceneIndex < editorState.scenes.length - 1) {
          video.pause();
          pendingPlaybackRef.current = true;
          const nextIndex = editorState.activeSceneIndex + 1;
          const updated = { ...editorState, activeSceneIndex: nextIndex };
          setEditorState(updated);
          setCurrentTime(updated.scenes[nextIndex].trim.startTime);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    const handleEnded = () => {
      if (editorState && editorState.activeSceneIndex < editorState.scenes.length - 1) {
        pendingPlaybackRef.current = true;
        const nextIndex = editorState.activeSceneIndex + 1;
        const updated = { ...editorState, activeSceneIndex: nextIndex };
        setEditorState(updated);
      } else {
        setIsPlaying(false);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [editorState, activeScene]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(5);
          break;
        case "z":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (activeScene && video.currentTime < activeScene.trim.startTime) {
        video.currentTime = activeScene.trim.startTime;
      }
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video || !activeScene) return;
    const newTime = Math.max(activeScene.trim.startTime, Math.min(activeScene.trim.endTime, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const switchScene = (index: number) => {
    if (!editorState || index < 0 || index >= editorState.scenes.length) return;
    const video = videoRef.current;
    if (video) {
      video.pause();
      setIsPlaying(false);
    }
    const updated = { ...editorState, activeSceneIndex: index };
    setEditorState(updated);
    setCurrentTime(updated.scenes[index].trim.startTime);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeScene) return;
    const currentSrc = video.getAttribute("src") || "";
    if (currentSrc !== activeScene.videoUrl) {
      video.src = activeScene.videoUrl;
      video.load();
      const handleCanPlay = () => {
        video.currentTime = activeScene.trim.startTime;
        if (pendingPlaybackRef.current) {
          pendingPlaybackRef.current = false;
          video.play().catch(() => {});
        }
        video.removeEventListener("canplay", handleCanPlay);
      };
      video.addEventListener("canplay", handleCanPlay);
    } else {
      video.currentTime = activeScene.trim.startTime;
      if (pendingPlaybackRef.current) {
        pendingPlaybackRef.current = false;
        video.play().catch(() => {});
      }
    }
  }, [activeScene?.id]);

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingTimeline(true);
    handleTimelineClick(e);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !activeScene) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;

    if (editorState) {
      const totalDur = editorState.scenes.reduce((t, s) => t + s.duration, 0);
      const clickedTime = percent * totalDur;
      let cumulative = 0;
      for (let i = 0; i < editorState.scenes.length; i++) {
        const sceneDur = editorState.scenes[i].duration;
        if (clickedTime <= cumulative + sceneDur) {
          if (i !== editorState.activeSceneIndex) {
            switchScene(i);
          }
          const sceneTime = clickedTime - cumulative;
          seekTo(Math.max(0, Math.min(sceneDur, sceneTime)));
          return;
        }
        cumulative += sceneDur;
      }
    }
  };

  useEffect(() => {
    if (!isDraggingTimeline) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || !activeScene || !editorState) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const totalDur = editorState.scenes.reduce((t, s) => t + s.duration, 0);
      const clickedTime = percent * totalDur;
      let cumulative = 0;
      for (let i = 0; i < editorState.scenes.length; i++) {
        const sceneDur = editorState.scenes[i].duration;
        if (clickedTime <= cumulative + sceneDur) {
          if (i !== editorState.activeSceneIndex) {
            switchScene(i);
          }
          seekTo(Math.max(0, Math.min(sceneDur, clickedTime - cumulative)));
          return;
        }
        cumulative += sceneDur;
      }
    };
    const handleMouseUp = () => setIsDraggingTimeline(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingTimeline, editorState, activeScene]);

  const handleSplitAtPlayhead = () => {
    if (!editorState || !activeScene) return;
    const cutDuration = 2;
    const cutStart = Math.max(activeScene.trim.startTime, currentTime - cutDuration / 2);
    const cutEnd = Math.min(activeScene.trim.endTime, currentTime + cutDuration / 2);
    const newCut: CutSegment = { id: generateId(), startTime: cutStart, endTime: cutEnd };
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = { ...activeScene, cuts: [...activeScene.cuts, newCut] };
    pushState({ ...editorState, scenes: updatedScenes });
    toast({ title: "Cut added", description: `Removed ${cutDuration}s segment at ${formatTime(currentTime)}` });
  };

  const removeCut = (cutId: string) => {
    if (!editorState || !activeScene) return;
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = { ...activeScene, cuts: activeScene.cuts.filter(c => c.id !== cutId) };
    pushState({ ...editorState, scenes: updatedScenes });
  };

  const addTextOverlay = () => {
    if (!editorState || !activeScene || !newText.trim()) return;
    const overlay: TextOverlay = {
      id: generateId(),
      text: newText.trim(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, activeScene?.trim.endTime || currentTime + 5),
      position: "bottom",
      fontSize: 32,
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
      fontWeight: "bold",
    };
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = {
      ...activeScene,
      textOverlays: [...activeScene.textOverlays, overlay],
    };
    pushState({ ...editorState, scenes: updatedScenes });
    setNewText("");
    toast({ title: "Text added", description: `"${overlay.text}" at ${formatTime(currentTime)}` });
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    if (!editorState || !activeScene) return;
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = {
      ...activeScene,
      textOverlays: activeScene.textOverlays.map(t => t.id === id ? { ...t, ...updates } : t),
    };
    pushState({ ...editorState, scenes: updatedScenes });
  };

  const removeTextOverlay = (id: string) => {
    if (!editorState || !activeScene) return;
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = {
      ...activeScene,
      textOverlays: activeScene.textOverlays.filter(t => t.id !== id),
    };
    pushState({ ...editorState, scenes: updatedScenes });
  };

  const updateFilters = (updates: Partial<FilterSettings>) => {
    if (!editorState) return;
    pushState({ ...editorState, filters: { ...editorState.filters, ...updates } });
  };

  const updateSceneVolume = (vol: number) => {
    if (!editorState || !activeScene) return;
    const video = videoRef.current;
    if (video) video.volume = vol;
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = { ...activeScene, volume: vol };
    pushState({ ...editorState, scenes: updatedScenes });
  };

  const updateTrimStart = (value: number) => {
    if (!editorState || !activeScene) return;
    const newStart = Math.min(value, activeScene.trim.endTime - 0.5);
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = {
      ...activeScene,
      trim: { ...activeScene.trim, startTime: newStart },
    };
    pushState({ ...editorState, scenes: updatedScenes });
    seekTo(newStart);
  };

  const updateTrimEnd = (value: number) => {
    if (!editorState || !activeScene) return;
    const newEnd = Math.max(value, activeScene.trim.startTime + 0.5);
    const updatedScenes = [...editorState.scenes];
    updatedScenes[editorState.activeSceneIndex] = {
      ...activeScene,
      trim: { ...activeScene.trim, endTime: newEnd },
    };
    pushState({ ...editorState, scenes: updatedScenes });
    seekTo(newEnd);
  };

  const moveScene = (fromIndex: number, direction: "up" | "down") => {
    if (!editorState) return;
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= editorState.scenes.length) return;
    const updatedScenes = [...editorState.scenes];
    [updatedScenes[fromIndex], updatedScenes[toIndex]] = [updatedScenes[toIndex], updatedScenes[fromIndex]];
    let newActiveIndex = editorState.activeSceneIndex;
    if (editorState.activeSceneIndex === fromIndex) newActiveIndex = toIndex;
    else if (editorState.activeSceneIndex === toIndex) newActiveIndex = fromIndex;
    pushState({ ...editorState, scenes: updatedScenes, activeSceneIndex: newActiveIndex });
  };

  const removeScene = (index: number) => {
    if (!editorState || editorState.scenes.length <= 1) return;
    const updatedScenes = editorState.scenes.filter((_, i) => i !== index);
    let newActiveIndex = editorState.activeSceneIndex;
    if (index <= newActiveIndex && newActiveIndex > 0) newActiveIndex--;
    pushState({ ...editorState, scenes: updatedScenes, activeSceneIndex: Math.min(newActiveIndex, updatedScenes.length - 1) });
    toast({ title: "Scene removed" });
  };

  const renameScene = (index: number, name: string) => {
    if (!editorState) return;
    const updatedScenes = [...editorState.scenes];
    updatedScenes[index] = { ...updatedScenes[index], name };
    pushState({ ...editorState, scenes: updatedScenes });
  };

  const handleAddClipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorState) return;

    setAddingClip(true);
    try {
      const response = await fetch("/api/objects/upload", { method: "POST" });
      const data = await response.json();

      await fetch(data.uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      const normalizeResp = await fetch("/api/normalize-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: data.uploadURL }),
      });
      const { normalizedPath } = await normalizeResp.json();

      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);
      
      const duration = await new Promise<number>((resolve) => {
        tempVideo.onloadedmetadata = () => {
          resolve(tempVideo.duration || 30);
          URL.revokeObjectURL(objectUrl);
        };
        tempVideo.onerror = () => {
          resolve(30);
          URL.revokeObjectURL(objectUrl);
        };
        tempVideo.src = objectUrl;
      });

      const sceneName = file.name.replace(/\.[^/.]+$/, "") || `Scene ${editorState.scenes.length + 1}`;
      const newScene = createInitialScene(normalizedPath, duration, sceneName);

      const updatedScenes = [...editorState.scenes, newScene];
      const newActiveIndex = updatedScenes.length - 1;
      pushState({
        ...editorState,
        scenes: updatedScenes,
        activeSceneIndex: newActiveIndex,
        totalDuration: updatedScenes.reduce((t, s) => t + s.duration, 0),
      });

      toast({ title: "Scene added!", description: `"${sceneName}" added to your timeline.` });
    } catch (err) {
      console.error("Failed to add clip:", err);
      toast({ title: "Upload failed", description: "Could not add the video clip.", variant: "destructive" });
    } finally {
      setAddingClip(false);
      if (addClipInputRef.current) addClipInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    if (!editorState || !project || !projectId) return;
    setExporting(true);
    setExportProgress({ stage: "Preparing export...", percent: 5 });
    try {
      setExportProgress({ stage: "Processing video on server...", percent: 15 });
      const resp = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes: editorState.scenes, filters: editorState.filters }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Export failed (${resp.status})`);
      }
      setExportProgress({ stage: "Downloading result...", percent: 90 });
      const blob = await resp.blob();
      downloadBlob(blob, `${project.name || "video"}_edited.mp4`);
      setExportProgress({ stage: "Complete!", percent: 100 });
      toast({ title: "Export complete!", description: "Your edited video has been downloaded." });
    } catch (err: any) {
      console.error("Export failed:", err);
      toast({ title: "Export failed", description: err.message || "An error occurred during export.", variant: "destructive" });
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  const activeOverlays = activeScene?.textOverlays.filter(
    t => currentTime >= t.startTime && currentTime <= t.endTime
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project || !project.originalVideoPath) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Video Not Found</h2>
            <p className="text-muted-foreground mb-4">Upload a video first to start editing.</p>
            <Button onClick={() => setLocation("/upload")}>Upload Video</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDuration = editorState ? editorState.scenes.reduce((t, s) => t + s.duration, 0) : 0;

  const getTimelinePlayheadPosition = (): number => {
    if (!editorState || totalDuration === 0) return 0;
    let cumulative = 0;
    for (let i = 0; i < editorState.activeSceneIndex; i++) {
      cumulative += editorState.scenes[i].duration;
    }
    return ((cumulative + currentTime) / totalDuration) * 100;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-3 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-[200px]">{project.name}</h1>
          <Badge variant="outline" className="text-xs">
            {editorState ? `${editorState.scenes.length} scene${editorState.scenes.length !== 1 ? "s" : ""}` : "0 scenes"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {editorState ? formatTime(getTotalEffectiveDuration(editorState)) : "0:00"} total
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export Video"}
          </Button>
        </div>
      </div>

      {exportProgress && (
        <div className="shrink-0 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{exportProgress.stage}</span>
            <span className="text-sm text-purple-600 dark:text-purple-400">{exportProgress.percent}%</span>
          </div>
          <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-[1fr_300px] gap-3">
        <div className="flex flex-col gap-3 min-h-0">
          <div className="relative bg-black rounded-lg overflow-hidden flex-1 flex items-center justify-center min-h-0">
            <video
              ref={videoRef}
              src={activeScene?.videoUrl}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: editorState ? getFilterCssString(editorState.filters) : "none",
              }}
              playsInline
              onLoadedMetadata={handleVideoMetadata}
              onClick={togglePlay}
            />
            {activeOverlays.map(overlay => (
              <div
                key={overlay.id}
                className="absolute left-0 right-0 flex justify-center pointer-events-none"
                style={{
                  top: overlay.position === "top" ? "10%" : overlay.position === "center" ? "45%" : undefined,
                  bottom: overlay.position === "bottom" ? "10%" : undefined,
                }}
              >
                <span
                  className="px-3 py-1.5 rounded"
                  style={{
                    fontSize: `${overlay.fontSize}px`,
                    color: overlay.color,
                    backgroundColor: overlay.backgroundColor,
                    fontWeight: overlay.fontWeight,
                  }}
                >
                  {overlay.text}
                </span>
              </div>
            ))}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </div>
            )}
            {activeScene && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Scene {(editorState?.activeSceneIndex ?? 0) + 1}: {activeScene.name}
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3 px-2">
            <Button variant="ghost" size="sm" onClick={() => skip(-5)}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={togglePlay} className="w-10 h-10 p-0">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => skip(5)}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono text-muted-foreground min-w-[100px]">
              {formatTime(currentTime)} / {activeScene ? formatTime(activeScene.duration) : "0:00"}
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-2 min-w-[120px]">
              <Button variant="ghost" size="sm" onClick={() => updateSceneVolume(activeScene?.volume === 0 ? 1 : 0)}>
                {activeScene?.volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[activeScene?.volume ?? 1]}
                onValueChange={([v]) => updateSceneVolume(v)}
                max={1}
                step={0.01}
                className="w-20"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={activeTool === "scenes" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool(activeTool === "scenes" ? null : "scenes")}
            >
              <Film className="w-3.5 h-3.5 mr-1" /> Scenes
            </Button>
            <Button
              variant={activeTool === "trim" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool(activeTool === "trim" ? null : "trim")}
            >
              <Scissors className="w-3.5 h-3.5 mr-1" /> Trim & Cut
            </Button>
            <Button
              variant={activeTool === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
            >
              <Type className="w-3.5 h-3.5 mr-1" /> Text
            </Button>
            <Button
              variant={activeTool === "filters" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool(activeTool === "filters" ? null : "filters")}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Filters
            </Button>
          </div>

          {activeTool === "scenes" && editorState && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Timeline Scenes</span>
                  <div>
                    <input
                      ref={addClipInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleAddClipUpload}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addClipInputRef.current?.click()}
                      disabled={addingClip}
                      className="text-xs"
                    >
                      {addingClip ? (
                        <span className="animate-spin mr-1">...</span>
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      Add Clip
                    </Button>
                  </div>
                </div>

                {editorState.scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      index === editorState.activeSceneIndex
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => switchScene(index)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => { e.stopPropagation(); moveScene(index, "up"); }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => { e.stopPropagation(); moveScene(index, "down"); }}
                        disabled={index === editorState.scenes.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <Film className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Input
                        value={scene.name}
                        onChange={(e) => { e.stopPropagation(); renameScene(index, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-xs border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(getSceneEffectiveDuration(scene))}
                        {scene.cuts.length > 0 && ` · ${scene.cuts.length} cut${scene.cuts.length !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                    {editorState.scenes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeScene(index); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}

                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  Click a scene to edit it. Use arrows to reorder. All scenes will be merged on export.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTool === "trim" && activeScene && (
            <Card>
              <CardContent className="p-3 space-y-4">
                <div className="text-xs text-muted-foreground">
                  Editing: <span className="font-medium text-foreground">{activeScene.name}</span>
                </div>

                {/* Trim summary */}
                <div className="bg-muted rounded-md p-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Original</span>
                    <span className="font-mono">{formatTime(activeScene.duration)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-medium">
                    <span>Trimmed duration</span>
                    <span className="font-mono">{formatTime(activeScene.trim.endTime - activeScene.trim.startTime)}</span>
                  </div>
                  {/* Visual trim bar */}
                  <div className="relative h-2 bg-muted-foreground/20 rounded-full mt-1">
                    <div
                      className="absolute h-full bg-green-500 rounded-full"
                      style={{
                        left: `${activeScene.duration > 0 ? (activeScene.trim.startTime / activeScene.duration) * 100 : 0}%`,
                        width: `${activeScene.duration > 0 ? ((activeScene.trim.endTime - activeScene.trim.startTime) / activeScene.duration) * 100 : 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Trim Start</label>
                    <span className="text-xs font-mono text-foreground">{formatTime(activeScene.trim.startTime)}</span>
                  </div>
                  <Slider
                    value={[activeScene.trim.startTime]}
                    onValueChange={([v]) => updateTrimStart(v)}
                    max={activeScene.duration}
                    step={0.1}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Drag to set clip start — video seeks to this point</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Trim End</label>
                    <span className="text-xs font-mono text-foreground">{formatTime(activeScene.trim.endTime)}</span>
                  </div>
                  <Slider
                    value={[activeScene.trim.endTime]}
                    onValueChange={([v]) => updateTrimEnd(v)}
                    max={activeScene.duration}
                    step={0.1}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Drag to set clip end — video seeks to this point</p>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Cut at Playhead</span>
                    <Button size="sm" variant="destructive" onClick={handleSplitAtPlayhead}>
                      <Scissors className="w-3 h-3 mr-1" /> Cut 2s
                    </Button>
                  </div>
                  {activeScene.cuts.length > 0 && (
                    <div className="space-y-1">
                      {activeScene.cuts.map(cut => (
                        <div key={cut.id} className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-950 p-1.5 rounded">
                          <span>{formatTime(cut.startTime)} - {formatTime(cut.endTime)}</span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeCut(cut.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTool === "text" && editorState && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter text..."
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTextOverlay()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={addTextOverlay} disabled={!newText.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Text appears at current playhead position for 5 seconds.</p>

                {(activeScene?.textOverlays || []).map(overlay => (
                  <div key={overlay.id} className="border rounded p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1">"{overlay.text}"</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => removeTextOverlay(overlay.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Position</label>
                        <select
                          className="w-full text-xs border rounded p-1 bg-background"
                          value={overlay.position}
                          onChange={e => updateTextOverlay(overlay.id, { position: e.target.value as any })}
                        >
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Size</label>
                        <Slider
                          value={[overlay.fontSize]}
                          onValueChange={([v]) => updateTextOverlay(overlay.id, { fontSize: v })}
                          min={12}
                          max={72}
                          step={1}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Color</label>
                        <input
                          type="color"
                          value={overlay.color}
                          onChange={e => updateTextOverlay(overlay.id, { color: e.target.value })}
                          className="w-full h-6 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Background</label>
                        <input
                          type="color"
                          value={overlay.backgroundColor.startsWith("rgba") ? "#000000" : overlay.backgroundColor}
                          onChange={e => updateTextOverlay(overlay.id, { backgroundColor: e.target.value + "cc" })}
                          className="w-full h-6 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-muted-foreground">{formatTime(overlay.startTime)} - {formatTime(overlay.endTime)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs px-1"
                        onClick={() => seekTo(overlay.startTime)}
                      >
                        Go to
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTool === "filters" && editorState && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Brightness: {editorState.filters.brightness}%
                  </label>
                  <Slider
                    value={[editorState.filters.brightness]}
                    onValueChange={([v]) => updateFilters({ brightness: v })}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Contrast: {editorState.filters.contrast}%
                  </label>
                  <Slider
                    value={[editorState.filters.contrast]}
                    onValueChange={([v]) => updateFilters({ contrast: v })}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Saturation: {editorState.filters.saturation}%
                  </label>
                  <Slider
                    value={[editorState.filters.saturation]}
                    onValueChange={([v]) => updateFilters({ saturation: v })}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                <div className="border-t pt-3">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Filter Presets</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["none", "grayscale", "sepia", "warm", "cool", "vintage"] as const).map(preset => (
                      <Button
                        key={preset}
                        variant={editorState.filters.preset === preset ? "default" : "outline"}
                        size="sm"
                        className="text-xs capitalize h-8"
                        onClick={() => updateFilters({ preset })}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => updateFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0, preset: "none" })}
                >
                  Reset All Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {!activeTool && (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a tool above to start editing</p>
                <div className="mt-3 text-xs space-y-1">
                  <p><kbd className="px-1 bg-muted rounded">Space</kbd> Play / Pause</p>
                  <p><kbd className="px-1 bg-muted rounded">←</kbd> <kbd className="px-1 bg-muted rounded">→</kbd> Skip 5s</p>
                  <p><kbd className="px-1 bg-muted rounded">Ctrl+Z</kbd> Undo</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {editorState && (
        <div className="shrink-0">
          <div
            ref={timelineRef}
            className="relative h-20 bg-muted rounded-lg cursor-pointer select-none border"
            onMouseDown={handleTimelineMouseDown}
          >
            {editorState.scenes.map((scene, index) => {
              let cumulative = 0;
              for (let i = 0; i < index; i++) cumulative += editorState.scenes[i].duration;
              const startPercent = totalDuration > 0 ? (cumulative / totalDuration) * 100 : 0;
              const widthPercent = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 100;

              const colors = [
                "bg-blue-500/20 border-blue-500/40",
                "bg-green-500/20 border-green-500/40",
                "bg-purple-500/20 border-purple-500/40",
                "bg-orange-500/20 border-orange-500/40",
                "bg-pink-500/20 border-pink-500/40",
                "bg-cyan-500/20 border-cyan-500/40",
              ];
              const activeColors = [
                "bg-blue-500/30 border-blue-500/60",
                "bg-green-500/30 border-green-500/60",
                "bg-purple-500/30 border-purple-500/60",
                "bg-orange-500/30 border-orange-500/60",
                "bg-pink-500/30 border-pink-500/60",
                "bg-cyan-500/30 border-cyan-500/60",
              ];

              const isActive = index === editorState.activeSceneIndex;
              const colorClass = isActive ? activeColors[index % activeColors.length] : colors[index % colors.length];

              return (
                <div
                  key={scene.id}
                  className={`absolute top-0 bottom-0 border-r ${colorClass} ${isActive ? "ring-1 ring-primary" : ""}`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    switchScene(index);
                  }}
                >
                  <span className="absolute top-1 left-1 text-[9px] font-medium text-foreground/70 truncate max-w-[90%]">
                    {scene.name}
                  </span>
                  <span className="absolute top-1 right-1 text-[8px] text-muted-foreground">
                    {formatTime(scene.duration)}
                  </span>

                  {scene.cuts.map(cut => {
                    const cutLeftPercent = scene.duration > 0 ? (cut.startTime / scene.duration) * 100 : 0;
                    const cutWidthPercent = scene.duration > 0 ? ((cut.endTime - cut.startTime) / scene.duration) * 100 : 0;
                    return (
                      <div
                        key={cut.id}
                        className="absolute top-3 bottom-3 bg-red-400/50 border-l border-r border-red-500/50"
                        style={{
                          left: `${cutLeftPercent}%`,
                          width: `${cutWidthPercent}%`,
                        }}
                      />
                    );
                  })}

                  <div
                    className="absolute bottom-0 h-2 bg-primary/20"
                    style={{
                      left: `${scene.duration > 0 ? (scene.trim.startTime / scene.duration) * 100 : 0}%`,
                      width: `${scene.duration > 0 ? ((scene.trim.endTime - scene.trim.startTime) / scene.duration) * 100 : 100}%`,
                    }}
                  />

                  <div
                    title="Drag to adjust trim start"
                    className="absolute top-0 bottom-0 w-4 bg-green-500 hover:bg-green-400 cursor-ew-resize z-20 flex items-center justify-center group rounded-l"
                    style={{
                      left: `${scene.duration > 0 ? (scene.trim.startTime / scene.duration) * 100 : 0}%`,
                    }}
                    onMouseDown={(e) => { e.stopPropagation(); startTrimDrag(index, "start", e); }}
                  >
                    <div className="w-0.5 h-5 bg-white/90 rounded" />
                  </div>

                  <div
                    title="Drag to adjust trim end"
                    className="absolute top-0 bottom-0 w-4 bg-green-500 hover:bg-green-400 cursor-ew-resize z-20 flex items-center justify-center group rounded-r"
                    style={{
                      left: `${scene.duration > 0 ? (scene.trim.endTime / scene.duration) * 100 : 100}%`,
                      transform: "translateX(-100%)",
                    }}
                    onMouseDown={(e) => { e.stopPropagation(); startTrimDrag(index, "end", e); }}
                  >
                    <div className="w-0.5 h-5 bg-white/90 rounded" />
                  </div>
                </div>
              );
            })}

            {editorState.scenes.map((scene, sceneIdx) => {
              let sceneOffset = 0;
              for (let i = 0; i < sceneIdx; i++) sceneOffset += editorState.scenes[i].duration;
              return scene.textOverlays.map(overlay => {
                const leftPercent = totalDuration > 0 ? ((sceneOffset + overlay.startTime) / totalDuration) * 100 : 0;
                const widthPercent = totalDuration > 0 ? ((overlay.endTime - overlay.startTime) / totalDuration) * 100 : 0;
                return (
                  <div
                    key={overlay.id}
                    className="absolute bottom-0 h-2 bg-yellow-400/60 rounded-t z-5"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 0.5)}%`,
                    }}
                  />
                );
              });
            })}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
              style={{ left: `${getTimelinePlayheadPosition()}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow border border-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
