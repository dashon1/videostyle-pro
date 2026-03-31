import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models (users and sessions tables)
export * from "./models/auth";
import { users } from "./models/auth";

// Re-export chat models (conversations and messages tables)
export * from "./models/chat";
import { conversations, messages } from "./models/chat";

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull(),
  plan: text("plan").default("free"), // free, pro, enterprise
  whiteLabelEnabled: boolean("white_label_enabled").default(false),
  customBranding: jsonb("custom_branding").$type<{
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").default("member"), // owner, admin, member, viewer
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
});

// ============== STYLE TEMPLATES & LEARNING ==============
export const styleTemplates = pgTable("style_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("fas fa-palette"),
  colorScheme: text("color_scheme").default("blue"),
  category: text("category").default("general"), // general, youtube, tiktok, podcast, corporate
  isPublic: boolean("is_public").default(false),
  isMarketplace: boolean("is_marketplace").default(false),
  price: real("price").default(0),
  authorId: varchar("author_id"),
  thumbnailUrl: text("thumbnail_url"),
  settings: jsonb("settings").notNull().$type<{
    cutFrequency: number;
    transitionType: string;
    musicStyle: string;
    textStyle: string;
    brandingPosition: string;
    pacing: string;
  }>(),
  usageCount: integer("usage_count").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const personalityPresets = pgTable("personality_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  creatorName: text("creator_name"), // e.g., "MrBeast Style", "MKBHD Style"
  learnedPatterns: jsonb("learned_patterns").$type<{
    avgCutDuration: number;
    transitionPreferences: string[];
    zoomPatterns: string[];
    textAnimations: string[];
    colorGrading: string;
    paceProfile: number[];
  }>(),
  sourceVideoCount: integer("source_video_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const brandVoiceTemplates = pgTable("brand_voice_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  userId: varchar("user_id"),
  introPattern: jsonb("intro_pattern").$type<{
    duration: number;
    elements: string[];
    musicType: string;
  }>(),
  outroPattern: jsonb("outro_pattern").$type<{
    duration: number;
    elements: string[];
    callToAction: string;
  }>(),
  lowerThirdsStyle: jsonb("lower_thirds_style").$type<{
    font: string;
    color: string;
    position: string;
    animation: string;
  }>(),
  graphicTreatments: jsonb("graphic_treatments").$type<{
    overlays: string[];
    transitions: string[];
    effects: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== PROJECTS & PROCESSING ==============
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  originalVideoPath: text("original_video_path"),
  processedVideoPath: text("processed_video_path"),
  thumbnailPath: text("thumbnail_path"),
  styleTemplateId: varchar("style_template_id"),
  brandVoiceTemplateId: varchar("brand_voice_template_id"),
  teamId: varchar("team_id"),
  status: text("status").notNull().default("pending"), // pending, processing, review, approved, completed, failed
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  progress: integer("progress").default(0), // 0-100
  estimatedTimeLeft: integer("estimated_time_left"), // in minutes
  processingOptions: jsonb("processing_options").$type<{
    enableAutoCut: boolean;
    enableSceneDetection: boolean;
    enableBRoll: boolean;
    enableCaptions: boolean;
    enableMusicMatching: boolean;
    enableSmartZoom: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectVersions = pgTable("project_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  videoPath: text("video_path"),
  changes: text("changes"),
  createdById: varchar("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const brandAssets = pgTable("brand_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // logo, intro, outro, font, colorScheme, watermark
  filePath: text("file_path"),
  teamId: varchar("team_id"),
  metadata: jsonb("metadata").$type<{
    colors?: string[];
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  progress: integer("progress").default(0),
  estimatedTimeLeft: integer("estimated_time_left"),
  currentStep: text("current_step"), // auto-cut, scene-detection, captions, music, etc.
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============== AI FEATURES ==============
export const aiAnalysisResults = pgTable("ai_analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  analysisType: text("analysis_type").notNull(), // auto-cut, scene-detection, b-roll, voice-clone, thumbnail
  results: jsonb("results").$type<{
    segments?: Array<{ start: number; end: number; confidence: number; type: string }>;
    scenes?: Array<{ start: number; end: number; description: string }>;
    suggestions?: Array<{ type: string; timestamp: number; content: string }>;
    thumbnails?: Array<{ url: string; score: number }>;
  }>(),
  confidence: real("confidence"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transcriptions = pgTable("transcriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  text: text("text"),
  segments: jsonb("segments").$type<Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
    confidence: number;
  }>>(),
  language: text("language").default("en"),
  captionStyle: jsonb("caption_style").$type<{
    font: string;
    size: number;
    color: string;
    backgroundColor: string;
    position: string;
  }>(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bRollSuggestions = pgTable("b_roll_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  timestamp: real("timestamp").notNull(),
  duration: real("duration"),
  keyword: text("keyword"),
  suggestions: jsonb("suggestions").$type<Array<{
    url: string;
    source: string;
    thumbnailUrl: string;
    duration: number;
    relevance: number;
  }>>(),
  selectedUrl: text("selected_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceClones = pgTable("voice_clones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  sampleAudioPaths: text("sample_audio_paths").array(),
  status: text("status").default("training"), // training, ready, failed
  voiceId: text("voice_id"), // External API voice ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedThumbnails = pgTable("generated_thumbnails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  imageUrl: text("image_url"),
  score: real("score"),
  elements: jsonb("elements").$type<{
    faces: number;
    text: string;
    emotion: string;
    colors: string[];
  }>(),
  selected: boolean("selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== MUSIC & AUDIO ==============
export const musicTracks = pgTable("music_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  artistName: text("artist_name"),
  genre: text("genre"),
  mood: text("mood"), // upbeat, calm, dramatic, corporate, etc.
  tempo: integer("tempo"), // BPM
  duration: integer("duration"), // seconds
  audioUrl: text("audio_url"),
  previewUrl: text("preview_url"),
  license: text("license").default("royalty-free"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const musicMatches = pgTable("music_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  trackId: varchar("track_id").notNull(),
  matchScore: real("match_score"),
  energyAlignment: real("energy_alignment"),
  selected: boolean("selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== PUBLISHING & SCHEDULING ==============
export const platformConnections = pgTable("platform_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  platform: text("platform").notNull(), // youtube, tiktok, instagram, linkedin, twitter
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  channelId: text("channel_id"),
  channelName: text("channel_name"),
  isActive: boolean("is_active").default(true),
  connectedAt: timestamp("connected_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const scheduledPublishes = pgTable("scheduled_publishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  platformConnectionId: varchar("platform_connection_id").notNull(),
  platform: text("platform").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  title: text("title"),
  description: text("description"),
  tags: text("tags").array(),
  visibility: text("visibility").default("public"), // public, unlisted, private
  status: text("status").default("scheduled"), // scheduled, publishing, published, failed
  publishedUrl: text("published_url"),
  platformVideoId: text("platform_video_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformFormats = pgTable("platform_formats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  platform: text("platform").notNull(),
  aspectRatio: text("aspect_ratio"), // 16:9, 9:16, 1:1, 4:5
  resolution: text("resolution"), // 720p, 1080p, 4k
  videoPath: text("video_path"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== COLLABORATION & REVIEW ==============
export const projectReviews = pgTable("project_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  status: text("status").default("pending"), // pending, approved, changes_requested, rejected
  feedback: text("feedback"),
  timestamp: real("timestamp"), // Video timestamp for feedback
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectComments = pgTable("project_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  parentId: varchar("parent_id"), // For threaded comments
  content: text("content").notNull(),
  timestamp: real("timestamp"), // Video timestamp
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== EXPORTS ==============
export const exports = pgTable("exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"),
  format: text("format").notNull(), // mp4, mov, avi, webm
  quality: text("quality").notNull(), // 720p, 1080p, 4k
  aspectRatio: text("aspect_ratio").default("16:9"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  whiteLabelEnabled: boolean("white_label_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== MARKETPLACE ==============
export const templatePurchases = pgTable("template_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  price: real("price").notNull(),
  transactionId: text("transaction_id"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const templateReviews = pgTable("template_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  userId: varchar("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== ANALYTICS & WATCH FOLDERS ==============
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  projectId: varchar("project_id"),
  eventType: text("event_type").notNull(), // project_created, processing_started, export_completed, etc.
  metadata: jsonb("metadata"),
  timeSavedMinutes: integer("time_saved_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchFolders = pgTable("watch_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  folderPath: text("folder_path").notNull(),
  styleTemplateId: varchar("style_template_id"),
  autoProcess: boolean("auto_process").default(true),
  outputFormat: text("output_format").default("mp4"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const batchJobs = pgTable("batch_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name"),
  styleTemplateId: varchar("style_template_id"),
  projectIds: text("project_ids").array(),
  status: text("status").default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0),
  totalItems: integer("total_items").default(0),
  completedItems: integer("completed_items").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== INSERT SCHEMAS ==============
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  invitedAt: true,
});

export const insertStyleTemplateSchema = createInsertSchema(styleTemplates).omit({
  id: true,
  usageCount: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
});

export const insertPersonalityPresetSchema = createInsertSchema(personalityPresets).omit({
  id: true,
  createdAt: true,
});

export const insertBrandVoiceTemplateSchema = createInsertSchema(brandVoiceTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  progress: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({
  id: true,
  createdAt: true,
});

export const insertBrandAssetSchema = createInsertSchema(brandAssets).omit({
  id: true,
  createdAt: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  progress: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiAnalysisResultSchema = createInsertSchema(aiAnalysisResults).omit({
  id: true,
  createdAt: true,
});

export const insertTranscriptionSchema = createInsertSchema(transcriptions).omit({
  id: true,
  createdAt: true,
});

export const insertBRollSuggestionSchema = createInsertSchema(bRollSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceCloneSchema = createInsertSchema(voiceClones).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedThumbnailSchema = createInsertSchema(generatedThumbnails).omit({
  id: true,
  createdAt: true,
});

export const insertMusicTrackSchema = createInsertSchema(musicTracks).omit({
  id: true,
  createdAt: true,
});

export const insertMusicMatchSchema = createInsertSchema(musicMatches).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections).omit({
  id: true,
  connectedAt: true,
});

export const insertScheduledPublishSchema = createInsertSchema(scheduledPublishes).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformFormatSchema = createInsertSchema(platformFormats).omit({
  id: true,
  createdAt: true,
});

export const insertProjectReviewSchema = createInsertSchema(projectReviews).omit({
  id: true,
  createdAt: true,
});

export const insertProjectCommentSchema = createInsertSchema(projectComments).omit({
  id: true,
  createdAt: true,
});

export const insertExportSchema = createInsertSchema(exports).omit({
  id: true,
  createdAt: true,
});

export const insertTemplatePurchaseSchema = createInsertSchema(templatePurchases).omit({
  id: true,
  purchasedAt: true,
});

export const insertTemplateReviewSchema = createInsertSchema(templateReviews).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertWatchFolderSchema = createInsertSchema(watchFolders).omit({
  id: true,
  createdAt: true,
});

export const insertBatchJobSchema = createInsertSchema(batchJobs).omit({
  id: true,
  createdAt: true,
});

// ============== TYPES ==============
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type StyleTemplate = typeof styleTemplates.$inferSelect;
export type InsertStyleTemplate = z.infer<typeof insertStyleTemplateSchema>;

export type PersonalityPreset = typeof personalityPresets.$inferSelect;
export type InsertPersonalityPreset = z.infer<typeof insertPersonalityPresetSchema>;

export type BrandVoiceTemplate = typeof brandVoiceTemplates.$inferSelect;
export type InsertBrandVoiceTemplate = z.infer<typeof insertBrandVoiceTemplateSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;

export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = z.infer<typeof insertBrandAssetSchema>;

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;

export type AiAnalysisResult = typeof aiAnalysisResults.$inferSelect;
export type InsertAiAnalysisResult = z.infer<typeof insertAiAnalysisResultSchema>;

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;

export type BRollSuggestion = typeof bRollSuggestions.$inferSelect;
export type InsertBRollSuggestion = z.infer<typeof insertBRollSuggestionSchema>;

export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertVoiceClone = z.infer<typeof insertVoiceCloneSchema>;

export type GeneratedThumbnail = typeof generatedThumbnails.$inferSelect;
export type InsertGeneratedThumbnail = z.infer<typeof insertGeneratedThumbnailSchema>;

export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = z.infer<typeof insertMusicTrackSchema>;

export type MusicMatch = typeof musicMatches.$inferSelect;
export type InsertMusicMatch = z.infer<typeof insertMusicMatchSchema>;

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;

export type ScheduledPublish = typeof scheduledPublishes.$inferSelect;
export type InsertScheduledPublish = z.infer<typeof insertScheduledPublishSchema>;

export type PlatformFormat = typeof platformFormats.$inferSelect;
export type InsertPlatformFormat = z.infer<typeof insertPlatformFormatSchema>;

export type ProjectReview = typeof projectReviews.$inferSelect;
export type InsertProjectReview = z.infer<typeof insertProjectReviewSchema>;

export type ProjectComment = typeof projectComments.$inferSelect;
export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;

export type Export = typeof exports.$inferSelect;
export type InsertExport = z.infer<typeof insertExportSchema>;

export type TemplatePurchase = typeof templatePurchases.$inferSelect;
export type InsertTemplatePurchase = z.infer<typeof insertTemplatePurchaseSchema>;

export type TemplateReview = typeof templateReviews.$inferSelect;
export type InsertTemplateReview = z.infer<typeof insertTemplateReviewSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type WatchFolder = typeof watchFolders.$inferSelect;
export type InsertWatchFolder = z.infer<typeof insertWatchFolderSchema>;

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = z.infer<typeof insertBatchJobSchema>;
