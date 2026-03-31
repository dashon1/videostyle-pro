import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import * as aiService from "./services/ai";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
const execFileAsync = promisify(execFile);
import { 
  insertStyleTemplateSchema, 
  insertProjectSchema, 
  insertBrandAssetSchema,
  insertExportSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertPersonalityPresetSchema,
  insertBrandVoiceTemplateSchema,
  insertProjectVersionSchema,
  insertAiAnalysisResultSchema,
  insertTranscriptionSchema,
  insertBRollSuggestionSchema,
  insertVoiceCloneSchema,
  insertGeneratedThumbnailSchema,
  insertMusicTrackSchema,
  insertMusicMatchSchema,
  insertPlatformConnectionSchema,
  insertScheduledPublishSchema,
  insertPlatformFormatSchema,
  insertProjectReviewSchema,
  insertProjectCommentSchema,
  insertTemplatePurchaseSchema,
  insertTemplateReviewSchema,
  insertAnalyticsEventSchema,
  insertWatchFolderSchema,
  insertBatchJobSchema
} from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";
import { stripeService } from "./stripeService";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import * as videoProcessing from "./services/videoProcessing";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============== OBJECT STORAGE ==============
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.sendStatus(404);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.post("/api/normalize-path", async (req, res) => {
    try {
      const { path } = req.body;
      if (!path) return res.status(400).json({ error: "Path required" });
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(path);
      res.json({ normalizedPath });
    } catch (error) {
      res.status(500).json({ error: "Failed to normalize path" });
    }
  });

  // ============== TEAMS & COLLABORATION ==============
  app.get("/api/teams", async (_req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.get("/api/teams/:teamId/members", async (req, res) => {
    try {
      const members = await storage.getTeamMembers(req.params.teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/teams/:teamId/members", async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        teamId: req.params.teamId
      });
      const member = await storage.addTeamMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add team member" });
    }
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      const deleted = await storage.removeTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // ============== STYLE TEMPLATES ==============
  app.get("/api/style-templates", async (_req, res) => {
    try {
      const templates = await storage.getStyleTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch style templates" });
    }
  });

  // Alias for /api/templates
  app.get("/api/templates", async (_req, res) => {
    try {
      const templates = await storage.getStyleTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/style-templates/marketplace", async (_req, res) => {
    try {
      const templates = await storage.getMarketplaceTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace templates" });
    }
  });

  app.get("/api/style-templates/:id", async (req, res) => {
    try {
      const template = await storage.getStyleTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Style template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch style template" });
    }
  });

  app.post("/api/style-templates", async (req, res) => {
    try {
      const validatedData = insertStyleTemplateSchema.parse(req.body);
      const template = await storage.createStyleTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create style template" });
    }
  });

  app.put("/api/style-templates/:id", async (req, res) => {
    try {
      const template = await storage.updateStyleTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Style template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update style template" });
    }
  });

  app.delete("/api/style-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStyleTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Style template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete style template" });
    }
  });

  // ============== PERSONALITY PRESETS ==============
  app.get("/api/personality-presets", async (_req, res) => {
    try {
      const presets = await storage.getPersonalityPresets();
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personality presets" });
    }
  });

  app.get("/api/personality-presets/:id", async (req, res) => {
    try {
      const preset = await storage.getPersonalityPreset(req.params.id);
      if (!preset) {
        return res.status(404).json({ error: "Personality preset not found" });
      }
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personality preset" });
    }
  });

  app.post("/api/personality-presets", async (req, res) => {
    try {
      const validatedData = insertPersonalityPresetSchema.parse(req.body);
      const preset = await storage.createPersonalityPreset(validatedData);
      res.status(201).json(preset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create personality preset" });
    }
  });

  app.delete("/api/personality-presets/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePersonalityPreset(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Personality preset not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete personality preset" });
    }
  });

  // ============== BRAND VOICE TEMPLATES ==============
  app.get("/api/brand-voice-templates", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const templates = await storage.getBrandVoiceTemplates(userId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brand voice templates" });
    }
  });

  app.post("/api/brand-voice-templates", async (req, res) => {
    try {
      const validatedData = insertBrandVoiceTemplateSchema.parse(req.body);
      const template = await storage.createBrandVoiceTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create brand voice template" });
    }
  });

  app.put("/api/brand-voice-templates/:id", async (req, res) => {
    try {
      const template = await storage.updateBrandVoiceTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Brand voice template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update brand voice template" });
    }
  });

  app.delete("/api/brand-voice-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBrandVoiceTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Brand voice template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete brand voice template" });
    }
  });

  // ============== PROJECTS ==============
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.get("/api/projects/:id/video", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const videoPath = project.processedVideoPath || project.originalVideoPath;
      if (!videoPath) {
        return res.status(404).json({ error: "No video file available" });
      }

      const objectStorageService = new ObjectStorageService();
      let objectPath = videoPath;
      if (videoPath.startsWith("https://storage.googleapis.com/")) {
        objectPath = objectStorageService.normalizeObjectEntityPath(videoPath);
      }

      if (objectPath.startsWith("/objects/")) {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        return objectStorageService.downloadObject(objectFile, res, 0);
      }

      return res.redirect(videoPath);
    } catch (error) {
      console.error("Error streaming video:", error);
      return res.status(500).json({ error: "Failed to stream video" });
    }
  });

  // ============== SERVER-SIDE VIDEO EXPORT ==============
  app.post("/api/projects/:id/export", async (req, res) => {
    const tmpDir = path.join("/tmp", `export_${Date.now()}_${req.params.id}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const downloadVideo = async (videoUrl: string, destPath: string): Promise<void> => {
      if (videoUrl.startsWith("/objects/")) {
        const objectStorageService = new ObjectStorageService();
        const file = await objectStorageService.getObjectEntityFile(videoUrl);
        await new Promise<void>((resolve, reject) => {
          const stream = file.createReadStream();
          const ws = fs.createWriteStream(destPath);
          stream.pipe(ws);
          ws.on("finish", resolve);
          ws.on("error", reject);
          stream.on("error", reject);
        });
      } else if (videoUrl.startsWith("/test-videos/")) {
        const filename = videoUrl.slice("/test-videos/".length);
        const srcPath = path.join(process.cwd(), "client/public/test-videos", filename);
        fs.copyFileSync(srcPath, destPath);
      } else if (videoUrl.startsWith("/api/projects/")) {
        const match = videoUrl.match(/\/api\/projects\/([^/]+)\/video/);
        if (match) {
          const proj = await storage.getProject(match[1]);
          const vPath = proj?.processedVideoPath || proj?.originalVideoPath;
          if (vPath) await downloadVideo(vPath, destPath);
          else throw new Error("Project video not found");
        }
      } else {
        throw new Error(`Unknown video URL: ${videoUrl}`);
      }
    };

    try {
      const { scenes, filters } = req.body;
      if (!scenes || !Array.isArray(scenes)) {
        return res.status(400).json({ error: "scenes required" });
      }

      const sceneFiles: string[] = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const inputFile = path.join(tmpDir, `input_${i}.mp4`);
        await downloadVideo(scene.videoUrl, inputFile);

        const trimStart = String(scene.trim?.startTime ?? 0);
        const trimEnd = String(scene.trim?.endTime ?? 999999);

        const vfParts: string[] = [];
        if (filters) {
          const b = ((filters.brightness ?? 100) - 100) / 200;
          const c = (filters.contrast ?? 100) / 100;
          const s = (filters.saturation ?? 100) / 100;
          if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
            vfParts.push(`eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}`);
          }
          if (filters.preset === "grayscale") vfParts.push("hue=s=0");
          if (filters.preset === "sepia") vfParts.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
        }

        const sceneFile = path.join(tmpDir, `scene_${i}.mp4`);
        const cuts: any[] = scene.cuts || [];
        const hasCuts = cuts.length > 0;

        if (hasCuts) {
          const kept: { start: number; end: number }[] = [];
          const tStart = scene.trim?.startTime ?? 0;
          const tEnd = scene.trim?.endTime ?? 999999;
          const sortedCuts = [...cuts].sort((a: any, b: any) => a.startTime - b.startTime);
          let pos = tStart;
          for (const cut of sortedCuts) {
            if (cut.startTime > pos) kept.push({ start: pos, end: cut.startTime });
            pos = cut.endTime;
          }
          if (pos < tEnd) kept.push({ start: pos, end: tEnd });

          const segFiles: string[] = [];
          for (let j = 0; j < kept.length; j++) {
            const seg = kept[j];
            const segFile = path.join(tmpDir, `seg_${i}_${j}.mp4`);
            const args = ["-i", inputFile, "-ss", String(seg.start), "-to", String(seg.end)];
            if (vfParts.length > 0) args.push("-vf", vfParts.join(","));
            if (scene.volume != null && scene.volume !== 1) args.push("-af", `volume=${scene.volume}`);
            args.push("-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", "-y", segFile);
            await execFileAsync("ffmpeg", args);
            segFiles.push(segFile);
          }
          if (segFiles.length === 1) {
            fs.renameSync(segFiles[0], sceneFile);
          } else {
            const cList = path.join(tmpDir, `concat_scene_${i}.txt`);
            fs.writeFileSync(cList, segFiles.map(f => `file '${f}'`).join("\n"));
            await execFileAsync("ffmpeg", ["-f", "concat", "-safe", "0", "-i", cList, "-c", "copy", "-y", sceneFile]);
          }
        } else {
          const args = ["-i", inputFile, "-ss", trimStart, "-to", trimEnd];
          if (vfParts.length > 0) args.push("-vf", vfParts.join(","));
          if (scene.volume != null && scene.volume !== 1) args.push("-af", `volume=${scene.volume}`);
          args.push("-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", "-y", sceneFile);
          await execFileAsync("ffmpeg", args);
        }

        sceneFiles.push(sceneFile);
      }

      let finalFile: string;
      if (sceneFiles.length === 1) {
        finalFile = sceneFiles[0];
      } else {
        const cList = path.join(tmpDir, "final_concat.txt");
        fs.writeFileSync(cList, sceneFiles.map(f => `file '${f}'`).join("\n"));
        finalFile = path.join(tmpDir, "output.mp4");
        await execFileAsync("ffmpeg", ["-f", "concat", "-safe", "0", "-i", cList, "-c", "copy", "-y", finalFile]);
      }

      const stat = fs.statSync(finalFile);
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="export.mp4"`);
      res.setHeader("Content-Length", String(stat.size));
      const readStream = fs.createReadStream(finalFile);
      readStream.pipe(res);
      res.on("finish", () => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      });
    } catch (err: any) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      console.error("Server export failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Export failed" });
      }
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      
      if (validatedData.originalVideoPath) {
        const objectStorageService = new ObjectStorageService();
        validatedData.originalVideoPath = objectStorageService.normalizeObjectEntityPath(validatedData.originalVideoPath);
      }
      
      const project = await storage.createProject(validatedData);
      
      // Create a processing job for this project
      if (project.originalVideoPath && project.styleTemplateId) {
        await storage.createProcessingJob({
          projectId: project.id,
          status: "queued",
          estimatedTimeLeft: Math.floor(Math.random() * 20) + 5,
        });
      }
      
      // Log analytics event
      await storage.createAnalyticsEvent({
        projectId: project.id,
        eventType: "project_created",
        timeSavedMinutes: 0
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ============== PROJECT VERSIONS (VERSION HISTORY) ==============
  app.get("/api/projects/:projectId/versions", async (req, res) => {
    try {
      const versions = await storage.getProjectVersions(req.params.projectId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project versions" });
    }
  });

  app.post("/api/projects/:projectId/versions", async (req, res) => {
    try {
      const versions = await storage.getProjectVersions(req.params.projectId);
      const validatedData = insertProjectVersionSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
        versionNumber: versions.length + 1
      });
      const version = await storage.createProjectVersion(validatedData);
      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project version" });
    }
  });

  // ============== PROJECT REVIEWS & COMMENTS ==============
  app.get("/api/projects/:projectId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProjectReviews(req.params.projectId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project reviews" });
    }
  });

  app.post("/api/projects/:projectId/reviews", async (req, res) => {
    try {
      const validatedData = insertProjectReviewSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const review = await storage.createProjectReview(validatedData);
      
      // Update project status based on review
      if (review.status === 'approved') {
        await storage.updateProject(req.params.projectId, { status: 'approved' });
      } else if (review.status === 'changes_requested') {
        await storage.updateProject(req.params.projectId, { status: 'review' });
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project review" });
    }
  });

  app.get("/api/projects/:projectId/comments", async (req, res) => {
    try {
      const comments = await storage.getProjectComments(req.params.projectId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project comments" });
    }
  });

  app.post("/api/projects/:projectId/comments", async (req, res) => {
    try {
      const validatedData = insertProjectCommentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const comment = await storage.createProjectComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project comment" });
    }
  });

  app.put("/api/comments/:id", async (req, res) => {
    try {
      const comment = await storage.updateProjectComment(req.params.id, req.body);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProjectComment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ============== BRAND ASSETS ==============
  app.get("/api/brand-assets", async (_req, res) => {
    try {
      const assets = await storage.getBrandAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brand assets" });
    }
  });

  app.post("/api/brand-assets", async (req, res) => {
    try {
      const validatedData = insertBrandAssetSchema.parse(req.body);
      const asset = await storage.createBrandAsset(validatedData);
      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create brand asset" });
    }
  });

  app.put("/api/brand-assets/:id", async (req, res) => {
    try {
      if (req.body.filePath) {
        const objectStorageService = new ObjectStorageService();
        const normalizedPath = objectStorageService.normalizeObjectEntityPath(req.body.filePath);
        req.body.filePath = normalizedPath;
      }
      
      const asset = await storage.updateBrandAsset(req.params.id, req.body);
      if (!asset) {
        return res.status(404).json({ error: "Brand asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to update brand asset" });
    }
  });

  app.delete("/api/brand-assets/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBrandAsset(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Brand asset not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete brand asset" });
    }
  });

  // ============== TRANSCRIPTIONS ==============
  app.get("/api/projects/:projectId/transcriptions", async (req, res) => {
    try {
      const transcription = await storage.getTranscription(req.params.projectId);
      res.json(transcription ? [transcription] : []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transcriptions" });
    }
  });

  // ============== AI ANALYSIS ==============
  app.get("/api/projects/:projectId/ai-analysis", async (req, res) => {
    try {
      const results = await storage.getAiAnalysisResults(req.params.projectId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI analysis results" });
    }
  });

  app.post("/api/projects/:projectId/ai-analysis", async (req, res) => {
    try {
      const validatedData = insertAiAnalysisResultSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const result = await storage.createAiAnalysisResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create AI analysis" });
    }
  });

  // AI Auto-Cut Analysis using OpenAI
  app.post("/api/projects/:projectId/analyze/auto-cut", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const { transcript } = req.body;
      
      let analysisResults;
      if (transcript) {
        // Use real AI analysis if transcript is provided
        analysisResults = await aiService.analyzeForAutoCut(transcript);
      } else {
        // Fallback to mock data for demo
        analysisResults = {
          fillerWords: [
            { start: 2.5, end: 4.0, word: "um" },
            { start: 8.5, end: 10.0, word: "like" },
          ],
          silences: [
            { start: 15.0, end: 16.5, duration: 1.5 },
          ],
          totalFillerTime: 3.0,
          totalSilenceTime: 1.5
        };
      }

      const transformedResults = {
        segments: [
          ...analysisResults.fillerWords.map(fw => ({
            start: fw.start,
            end: fw.end,
            confidence: 0.9,
            type: "filler"
          })),
          ...analysisResults.silences.map(s => ({
            start: s.start,
            end: s.end,
            confidence: 0.85,
            type: "silence"
          }))
        ]
      };

      const result = await storage.createAiAnalysisResult({
        projectId,
        analysisType: "auto-cut",
        results: transformedResults,
        confidence: 0.89,
        status: "completed"
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Auto-cut analysis error:", error);
      res.status(500).json({ error: "Failed to run auto-cut analysis" });
    }
  });

  // AI Scene Detection using OpenAI
  app.post("/api/projects/:projectId/analyze/scenes", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const { transcript } = req.body;
      
      let sceneResults;
      if (transcript) {
        // Use real AI analysis if transcript is provided
        sceneResults = await aiService.detectScenes(transcript);
      } else {
        // Fallback to mock data for demo
        sceneResults = {
          scenes: [
            { start: 0, end: 30, title: "Introduction", description: "Welcome and overview" },
            { start: 30, end: 120, title: "Main Topic", description: "Core content discussion" },
            { start: 120, end: 180, title: "Examples", description: "Practical demonstrations" },
            { start: 180, end: 240, title: "Q&A", description: "Audience questions" },
            { start: 240, end: 300, title: "Conclusion", description: "Summary and call to action" },
          ],
          chapters: [
            { timestamp: 0, title: "Introduction" },
            { timestamp: 30, title: "Main Topic" },
            { timestamp: 120, title: "Examples" },
            { timestamp: 180, title: "Q&A" },
            { timestamp: 240, title: "Conclusion" },
          ]
        };
      }

      const result = await storage.createAiAnalysisResult({
        projectId,
        analysisType: "scene-detection",
        results: sceneResults,
        confidence: 0.91,
        status: "completed"
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Scene detection error:", error);
      res.status(500).json({ error: "Failed to run scene detection" });
    }
  });

  // ============== TRANSCRIPTIONS & CAPTIONS ==============
  app.get("/api/projects/:projectId/transcription", async (req, res) => {
    try {
      const transcription = await storage.getTranscription(req.params.projectId);
      res.json(transcription || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transcription" });
    }
  });

  app.post("/api/projects/:projectId/transcription", async (req, res) => {
    try {
      const validatedData = insertTranscriptionSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const transcription = await storage.createTranscription(validatedData);
      res.status(201).json(transcription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transcription" });
    }
  });

  // Simulate Auto-Transcription
  app.post("/api/projects/:projectId/generate-transcription", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      const mockSegments = [
        { start: 0, end: 5, text: "Hey everyone, welcome back to the channel!", speaker: "Host", confidence: 0.98 },
        { start: 5, end: 12, text: "Today we're going to be talking about something really exciting.", speaker: "Host", confidence: 0.95 },
        { start: 12, end: 20, text: "So let's dive right into it and see what we can learn.", speaker: "Host", confidence: 0.97 },
        { start: 20, end: 30, text: "First, I want to show you this amazing feature that I discovered.", speaker: "Host", confidence: 0.94 },
      ];

      const transcription = await storage.createTranscription({
        projectId,
        text: mockSegments.map(s => s.text).join(" "),
        segments: mockSegments,
        language: "en",
        status: "completed",
        captionStyle: {
          font: "Inter",
          size: 24,
          color: "#FFFFFF",
          backgroundColor: "#000000CC",
          position: "bottom"
        }
      });

      res.status(201).json(transcription);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate transcription" });
    }
  });

  // ============== B-ROLL SUGGESTIONS ==============
  app.get("/api/projects/:projectId/b-roll", async (req, res) => {
    try {
      const suggestions = await storage.getBRollSuggestions(req.params.projectId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch B-Roll suggestions" });
    }
  });

  app.post("/api/projects/:projectId/generate-b-roll", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      // Simulate AI B-Roll suggestions
      const mockSuggestions = [
        {
          projectId,
          timestamp: 15.0,
          duration: 3.0,
          keyword: "technology",
          suggestions: [
            { url: "https://example.com/stock/tech1.mp4", source: "Pexels", thumbnailUrl: "/api/placeholder/160/90", duration: 10, relevance: 0.95 },
            { url: "https://example.com/stock/tech2.mp4", source: "Pexels", thumbnailUrl: "/api/placeholder/160/90", duration: 8, relevance: 0.88 },
          ]
        },
        {
          projectId,
          timestamp: 45.0,
          duration: 4.0,
          keyword: "business meeting",
          suggestions: [
            { url: "https://example.com/stock/meeting1.mp4", source: "Pexels", thumbnailUrl: "/api/placeholder/160/90", duration: 12, relevance: 0.92 },
          ]
        }
      ];

      const created = [];
      for (const suggestion of mockSuggestions) {
        const result = await storage.createBRollSuggestion(suggestion);
        created.push(result);
      }

      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate B-Roll suggestions" });
    }
  });

  // ============== VOICE CLONES ==============
  app.get("/api/voice-clones", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default";
      const clones = await storage.getVoiceClones(userId);
      res.json(clones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice clones" });
    }
  });

  app.post("/api/voice-clones", async (req, res) => {
    try {
      const validatedData = insertVoiceCloneSchema.parse(req.body);
      const clone = await storage.createVoiceClone(validatedData);
      
      // Simulate training completion after 5 seconds
      setTimeout(async () => {
        await storage.updateVoiceClone(clone.id, {
          status: "ready",
          voiceId: `voice_${clone.id.slice(0, 8)}`
        });
      }, 5000);
      
      res.status(201).json(clone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create voice clone" });
    }
  });

  app.delete("/api/voice-clones/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVoiceClone(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Voice clone not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete voice clone" });
    }
  });

  // ============== AI THUMBNAILS ==============
  app.get("/api/projects/:projectId/thumbnails", async (req, res) => {
    try {
      const thumbnails = await storage.getGeneratedThumbnails(req.params.projectId);
      res.json(thumbnails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thumbnails" });
    }
  });

  app.post("/api/projects/:projectId/generate-thumbnails", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      // Simulate AI thumbnail generation
      const mockThumbnails = [
        {
          projectId,
          imageUrl: "/api/placeholder/1280/720",
          score: 0.95,
          elements: { faces: 1, text: "AMAZING!", emotion: "excited", colors: ["#FF5733", "#FFC300"] },
          selected: false
        },
        {
          projectId,
          imageUrl: "/api/placeholder/1280/720",
          score: 0.88,
          elements: { faces: 1, text: "Check This Out", emotion: "curious", colors: ["#3498DB", "#2ECC71"] },
          selected: false
        },
        {
          projectId,
          imageUrl: "/api/placeholder/1280/720",
          score: 0.82,
          elements: { faces: 2, text: "NEW VIDEO", emotion: "happy", colors: ["#9B59B6", "#E74C3C"] },
          selected: false
        }
      ];

      const created = [];
      for (const thumbnail of mockThumbnails) {
        const result = await storage.createGeneratedThumbnail(thumbnail);
        created.push(result);
      }

      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate thumbnails" });
    }
  });

  app.put("/api/thumbnails/:id/select", async (req, res) => {
    try {
      const thumbnail = await storage.updateGeneratedThumbnail(req.params.id, { selected: true });
      if (!thumbnail) {
        return res.status(404).json({ error: "Thumbnail not found" });
      }
      res.json(thumbnail);
    } catch (error) {
      res.status(500).json({ error: "Failed to select thumbnail" });
    }
  });

  // ============== MUSIC MATCHING ==============
  app.get("/api/music-tracks", async (req, res) => {
    try {
      const mood = req.query.mood as string | undefined;
      const tracks = mood 
        ? await storage.getMusicTracksByMood(mood)
        : await storage.getMusicTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch music tracks" });
    }
  });

  app.get("/api/projects/:projectId/music-matches", async (req, res) => {
    try {
      const matches = await storage.getMusicMatches(req.params.projectId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch music matches" });
    }
  });

  app.post("/api/projects/:projectId/match-music", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const tracks = await storage.getMusicTracks();
      
      // Simulate music matching with scores
      const matches = [];
      for (const track of tracks) {
        const match = await storage.createMusicMatch({
          projectId,
          trackId: track.id,
          matchScore: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
          energyAlignment: Math.random() * 0.3 + 0.7,
          selected: false
        });
        matches.push(match);
      }

      res.status(201).json(matches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)));
    } catch (error) {
      res.status(500).json({ error: "Failed to match music" });
    }
  });

  app.put("/api/music-matches/:id/select", async (req, res) => {
    try {
      const match = await storage.updateMusicMatch(req.params.id, { selected: true });
      if (!match) {
        return res.status(404).json({ error: "Music match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: "Failed to select music match" });
    }
  });

  // ============== PLATFORM CONNECTIONS ==============
  app.get("/api/platform-connections", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default";
      const connections = await storage.getPlatformConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform connections" });
    }
  });

  app.post("/api/platform-connections", async (req, res) => {
    try {
      const validatedData = insertPlatformConnectionSchema.parse(req.body);
      const connection = await storage.createPlatformConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create platform connection" });
    }
  });

  app.delete("/api/platform-connections/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlatformConnection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Platform connection not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete platform connection" });
    }
  });

  // ============== SCHEDULED PUBLISHES ==============
  app.get("/api/scheduled-publishes", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const publishes = await storage.getScheduledPublishes(projectId);
      res.json(publishes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduled publishes" });
    }
  });

  app.post("/api/scheduled-publishes", async (req, res) => {
    try {
      const validatedData = insertScheduledPublishSchema.parse(req.body);
      const publish = await storage.createScheduledPublish(validatedData);
      res.status(201).json(publish);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create scheduled publish" });
    }
  });

  app.put("/api/scheduled-publishes/:id", async (req, res) => {
    try {
      const publish = await storage.updateScheduledPublish(req.params.id, req.body);
      if (!publish) {
        return res.status(404).json({ error: "Scheduled publish not found" });
      }
      res.json(publish);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scheduled publish" });
    }
  });

  app.delete("/api/scheduled-publishes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScheduledPublish(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Scheduled publish not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scheduled publish" });
    }
  });

  // Simulate Direct Publish
  app.post("/api/projects/:projectId/publish", async (req, res) => {
    try {
      const { platform, title, description, tags, visibility } = req.body;
      
      const publish = await storage.createScheduledPublish({
        projectId: req.params.projectId,
        platformConnectionId: "demo-connection",
        platform,
        scheduledAt: new Date(),
        title,
        description,
        tags,
        visibility,
        status: "publishing"
      });

      // Simulate publishing completion
      setTimeout(async () => {
        await storage.updateScheduledPublish(publish.id, {
          status: "published",
          publishedUrl: `https://${platform}.com/watch?v=demo123`,
          platformVideoId: "demo123"
        });
      }, 3000);

      res.status(201).json(publish);
    } catch (error) {
      res.status(500).json({ error: "Failed to publish video" });
    }
  });

  // ============== PLATFORM FORMATS (MULTI-FORMAT EXPORT) ==============
  app.get("/api/projects/:projectId/formats", async (req, res) => {
    try {
      const formats = await storage.getPlatformFormats(req.params.projectId);
      res.json(formats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform formats" });
    }
  });

  app.post("/api/projects/:projectId/formats", async (req, res) => {
    try {
      const validatedData = insertPlatformFormatSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const format = await storage.createPlatformFormat(validatedData);
      
      // Simulate format generation
      setTimeout(async () => {
        await storage.updatePlatformFormat(format.id, {
          status: "completed",
          videoPath: `/objects/exports/${format.id}.mp4`
        });
      }, 5000);
      
      res.status(201).json(format);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create platform format" });
    }
  });

  // Generate all platform formats at once
  app.post("/api/projects/:projectId/generate-all-formats", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      const platformFormats = [
        { platform: "youtube", aspectRatio: "16:9", resolution: "1080p" },
        { platform: "tiktok", aspectRatio: "9:16", resolution: "1080p" },
        { platform: "instagram-reels", aspectRatio: "9:16", resolution: "1080p" },
        { platform: "instagram-feed", aspectRatio: "1:1", resolution: "1080p" },
        { platform: "twitter", aspectRatio: "16:9", resolution: "720p" },
        { platform: "linkedin", aspectRatio: "16:9", resolution: "1080p" },
      ];

      const formats: any[] = [];
      for (const pf of platformFormats) {
        const format = await storage.createPlatformFormat({
          projectId,
          ...pf,
          status: "pending"
        });
        formats.push(format);
      }

      // Simulate generation
      setTimeout(async () => {
        for (const format of formats) {
          await storage.updatePlatformFormat(format.id, {
            status: "completed",
            videoPath: `/objects/exports/${format.id}.mp4`
          });
        }
      }, 8000);

      res.status(201).json(formats);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate platform formats" });
    }
  });

  // ============== PROCESSING JOBS ==============
  app.get("/api/processing-jobs", async (_req, res) => {
    try {
      const jobs = await storage.getProcessingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing jobs" });
    }
  });

  app.get("/api/processing-jobs/active", async (_req, res) => {
    try {
      const jobs = await storage.getActiveProcessingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active processing jobs" });
    }
  });

  // ============== EXPORTS ==============
  app.get("/api/exports", async (_req, res) => {
    try {
      const exports = await storage.getExports();
      res.json(exports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exports" });
    }
  });

  app.get("/api/projects/:projectId/exports", async (req, res) => {
    try {
      const exports = await storage.getExportsByProject(req.params.projectId);
      res.json(exports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project exports" });
    }
  });

  app.post("/api/exports", async (req, res) => {
    try {
      const validatedData = insertExportSchema.parse(req.body);
      const exportData = await storage.createExport(validatedData);
      
      // Log analytics event
      await storage.createAnalyticsEvent({
        projectId: exportData.projectId || undefined,
        eventType: "export_started",
        timeSavedMinutes: 0
      });
      
      res.status(201).json(exportData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create export" });
    }
  });

  // ============== TEMPLATE MARKETPLACE ==============
  app.get("/api/marketplace/templates", async (_req, res) => {
    try {
      const templates = await storage.getMarketplaceTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace templates" });
    }
  });

  app.get("/api/marketplace/templates/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getTemplateReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template reviews" });
    }
  });

  app.post("/api/marketplace/templates/:id/reviews", async (req, res) => {
    try {
      const validatedData = insertTemplateReviewSchema.parse({
        ...req.body,
        templateId: req.params.id
      });
      const review = await storage.createTemplateReview(validatedData);
      
      // Update template rating
      const reviews = await storage.getTemplateReviews(req.params.id);
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await storage.updateStyleTemplate(req.params.id, {
        rating: avgRating,
        reviewCount: reviews.length
      });
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create template review" });
    }
  });

  app.post("/api/marketplace/templates/:id/purchase", async (req, res) => {
    try {
      const template = await storage.getStyleTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const { buyerId, sessionId } = req.body;
      
      const alreadyPurchased = await storage.hasUserPurchasedTemplate(buyerId, req.params.id);
      if (alreadyPurchased) {
        return res.status(400).json({ error: "Template already purchased" });
      }

      if (template.price && template.price > 0) {
        if (!sessionId) {
          return res.status(400).json({ 
            error: "Payment required", 
            requiresPayment: true,
            price: template.price 
          });
        }

        try {
          const stripe = await getUncachableStripeClient();
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          
          if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: "Payment not completed" });
          }
          
          if (session.metadata?.templateId !== req.params.id) {
            return res.status(400).json({ error: "Payment session does not match template" });
          }
        } catch (stripeError) {
          return res.status(400).json({ error: "Invalid payment session" });
        }
      }

      const purchase = await storage.createTemplatePurchase({
        templateId: req.params.id,
        buyerId,
        sellerId: template.authorId || "platform",
        price: template.price || 0,
        transactionId: sessionId || `free_${Date.now()}`
      });

      await storage.updateStyleTemplate(req.params.id, {
        usageCount: (template.usageCount || 0) + 1
      });

      res.status(201).json(purchase);
    } catch (error) {
      res.status(500).json({ error: "Failed to purchase template" });
    }
  });

  app.get("/api/marketplace/purchases", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default";
      const purchases = await storage.getTemplatePurchases(userId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  // ============== STRIPE PAYMENT ROUTES ==============
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const products = await stripeService.listProducts();
      res.json({ data: products });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/stripe/products-with-prices", async (_req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map<string, any>();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products with prices" });
    }
  });

  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const { priceId, templateId, buyerId, successUrl, cancelUrl } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: successUrl || `${req.protocol}://${req.get('host')}/marketplace?success=true&template=${templateId}`,
        cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/marketplace?canceled=true`,
        metadata: {
          templateId: templateId || '',
          buyerId: buyerId || ''
        }
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // ============== WATCH FOLDERS ==============
  app.get("/api/watch-folders", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default";
      const folders = await storage.getWatchFolders(userId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch watch folders" });
    }
  });

  app.post("/api/watch-folders", async (req, res) => {
    try {
      const validatedData = insertWatchFolderSchema.parse(req.body);
      const folder = await storage.createWatchFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create watch folder" });
    }
  });

  app.put("/api/watch-folders/:id", async (req, res) => {
    try {
      const folder = await storage.updateWatchFolder(req.params.id, req.body);
      if (!folder) {
        return res.status(404).json({ error: "Watch folder not found" });
      }
      res.json(folder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update watch folder" });
    }
  });

  app.delete("/api/watch-folders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWatchFolder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Watch folder not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete watch folder" });
    }
  });

  // ============== BATCH JOBS ==============
  app.get("/api/batch-jobs", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default";
      const jobs = await storage.getBatchJobs(userId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch jobs" });
    }
  });

  app.post("/api/batch-jobs", async (req, res) => {
    try {
      const validatedData = insertBatchJobSchema.parse(req.body);
      const job = await storage.createBatchJob({
        ...validatedData,
        status: "processing",
        progress: 0,
        completedItems: 0,
        totalItems: validatedData.projectIds?.length || 0
      });

      // Simulate batch processing
      let completed = 0;
      const total = job.totalItems || 1;
      const interval = setInterval(async () => {
        completed++;
        const progress = Math.round((completed / total) * 100);
        await storage.updateBatchJob(job.id, {
          progress,
          completedItems: completed,
          status: completed >= total ? "completed" : "processing"
        });
        if (completed >= total) {
          clearInterval(interval);
        }
      }, 3000);

      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create batch job" });
    }
  });

  // ============== ANALYTICS ==============
  app.get("/api/analytics/events", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const events = await storage.getAnalyticsEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics events" });
    }
  });

  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const summary = await storage.getAnalyticsSummary(userId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      const templates = await storage.getStyleTemplates();
      const completedProjects = projects.filter(p => p.status === 'completed');
      
      // Calculate total time saved (assuming 5 hours saved per completed project)
      const timeSavedHours = completedProjects.length * 5;
      
      // Calculate storage used (sum of all project file sizes)
      const storageUsedBytes = projects.reduce((total, project) => total + (project.fileSize || 0), 0);
      const storageUsedGB = Math.round(storageUsedBytes / (1024 * 1024 * 1024) * 10) / 10;

      const stats = {
        videosProcessed: completedProjects.length,
        timeSaved: `${timeSavedHours}h`,
        activeTemplates: templates.length,
        storageUsed: `${storageUsedGB}GB`,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/projects/:projectId/start-processing", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const { options } = req.body;
      
      const jobs = await storage.getActiveProcessingJobs();
      const existingJob = jobs.find(job => job.projectId === projectId);
      
      if (!existingJob) {
        await storage.createProcessingJob({
          projectId,
          status: "processing",
          estimatedTimeLeft: 10,
        });
      }

      await videoProcessing.startProcessing(projectId, options || {});
      
      res.json({ message: "Processing started", projectId });
    } catch (error: any) {
      console.error("Processing error:", error);
      res.status(500).json({ error: error.message || "Failed to start processing" });
    }
  });

  app.post("/api/projects/:projectId/cancel-processing", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const cancelled = videoProcessing.cancelProcessing(projectId);
      
      if (cancelled) {
        res.json({ message: "Processing cancellation requested" });
      } else {
        res.status(404).json({ error: "No active processing found for this project" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel processing" });
    }
  });

  app.post("/api/simulate-processing/:projectId", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      await videoProcessing.startProcessing(projectId, {});
      res.json({ message: "Processing started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start processing" });
    }
  });

  // Preview generation endpoint
  app.post("/api/projects/:projectId/preview", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Simulate preview generation (30-second preview)
      res.json({
        previewUrl: `/objects/previews/${projectId}_preview.mp4`,
        duration: 30,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
