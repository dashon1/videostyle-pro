import { 
  type User, 
  type InsertUser,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type StyleTemplate,
  type InsertStyleTemplate,
  type PersonalityPreset,
  type InsertPersonalityPreset,
  type BrandVoiceTemplate,
  type InsertBrandVoiceTemplate,
  type Project,
  type InsertProject,
  type ProjectVersion,
  type InsertProjectVersion,
  type BrandAsset,
  type InsertBrandAsset,
  type ProcessingJob,
  type InsertProcessingJob,
  type AiAnalysisResult,
  type InsertAiAnalysisResult,
  type Transcription,
  type InsertTranscription,
  type BRollSuggestion,
  type InsertBRollSuggestion,
  type VoiceClone,
  type InsertVoiceClone,
  type GeneratedThumbnail,
  type InsertGeneratedThumbnail,
  type MusicTrack,
  type InsertMusicTrack,
  type MusicMatch,
  type InsertMusicMatch,
  type PlatformConnection,
  type InsertPlatformConnection,
  type ScheduledPublish,
  type InsertScheduledPublish,
  type PlatformFormat,
  type InsertPlatformFormat,
  type ProjectReview,
  type InsertProjectReview,
  type ProjectComment,
  type InsertProjectComment,
  type Export,
  type InsertExport,
  type TemplatePurchase,
  type InsertTemplatePurchase,
  type TemplateReview,
  type InsertTemplateReview,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type WatchFolder,
  type InsertWatchFolder,
  type BatchJob,
  type InsertBatchJob
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  // Team Members
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(id: string): Promise<boolean>;
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined>;
  
  // Style Templates
  getStyleTemplates(): Promise<StyleTemplate[]>;
  getStyleTemplate(id: string): Promise<StyleTemplate | undefined>;
  getMarketplaceTemplates(): Promise<StyleTemplate[]>;
  createStyleTemplate(template: InsertStyleTemplate): Promise<StyleTemplate>;
  updateStyleTemplate(id: string, updates: Partial<StyleTemplate>): Promise<StyleTemplate | undefined>;
  deleteStyleTemplate(id: string): Promise<boolean>;

  // Personality Presets
  getPersonalityPresets(): Promise<PersonalityPreset[]>;
  getPersonalityPreset(id: string): Promise<PersonalityPreset | undefined>;
  createPersonalityPreset(preset: InsertPersonalityPreset): Promise<PersonalityPreset>;
  updatePersonalityPreset(id: string, updates: Partial<PersonalityPreset>): Promise<PersonalityPreset | undefined>;
  deletePersonalityPreset(id: string): Promise<boolean>;

  // Brand Voice Templates
  getBrandVoiceTemplates(userId?: string): Promise<BrandVoiceTemplate[]>;
  getBrandVoiceTemplate(id: string): Promise<BrandVoiceTemplate | undefined>;
  createBrandVoiceTemplate(template: InsertBrandVoiceTemplate): Promise<BrandVoiceTemplate>;
  updateBrandVoiceTemplate(id: string, updates: Partial<BrandVoiceTemplate>): Promise<BrandVoiceTemplate | undefined>;
  deleteBrandVoiceTemplate(id: string): Promise<boolean>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByTeam(teamId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Project Versions
  getProjectVersions(projectId: string): Promise<ProjectVersion[]>;
  createProjectVersion(version: InsertProjectVersion): Promise<ProjectVersion>;

  // Brand Assets
  getBrandAssets(): Promise<BrandAsset[]>;
  getBrandAsset(id: string): Promise<BrandAsset | undefined>;
  getBrandAssetsByTeam(teamId: string): Promise<BrandAsset[]>;
  createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset>;
  updateBrandAsset(id: string, updates: Partial<BrandAsset>): Promise<BrandAsset | undefined>;
  deleteBrandAsset(id: string): Promise<boolean>;
  
  // Processing Jobs
  getProcessingJobs(): Promise<ProcessingJob[]>;
  getProcessingJob(id: string): Promise<ProcessingJob | undefined>;
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined>;
  getActiveProcessingJobs(): Promise<ProcessingJob[]>;

  // AI Analysis Results
  getAiAnalysisResults(projectId: string): Promise<AiAnalysisResult[]>;
  createAiAnalysisResult(result: InsertAiAnalysisResult): Promise<AiAnalysisResult>;
  updateAiAnalysisResult(id: string, updates: Partial<AiAnalysisResult>): Promise<AiAnalysisResult | undefined>;

  // Transcriptions
  getTranscription(projectId: string): Promise<Transcription | undefined>;
  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription | undefined>;

  // B-Roll Suggestions
  getBRollSuggestions(projectId: string): Promise<BRollSuggestion[]>;
  createBRollSuggestion(suggestion: InsertBRollSuggestion): Promise<BRollSuggestion>;
  updateBRollSuggestion(id: string, updates: Partial<BRollSuggestion>): Promise<BRollSuggestion | undefined>;

  // Voice Clones
  getVoiceClones(userId: string): Promise<VoiceClone[]>;
  createVoiceClone(clone: InsertVoiceClone): Promise<VoiceClone>;
  updateVoiceClone(id: string, updates: Partial<VoiceClone>): Promise<VoiceClone | undefined>;
  deleteVoiceClone(id: string): Promise<boolean>;

  // Generated Thumbnails
  getGeneratedThumbnails(projectId: string): Promise<GeneratedThumbnail[]>;
  createGeneratedThumbnail(thumbnail: InsertGeneratedThumbnail): Promise<GeneratedThumbnail>;
  updateGeneratedThumbnail(id: string, updates: Partial<GeneratedThumbnail>): Promise<GeneratedThumbnail | undefined>;

  // Music Tracks
  getMusicTracks(): Promise<MusicTrack[]>;
  getMusicTracksByMood(mood: string): Promise<MusicTrack[]>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;

  // Music Matches
  getMusicMatches(projectId: string): Promise<MusicMatch[]>;
  createMusicMatch(match: InsertMusicMatch): Promise<MusicMatch>;
  updateMusicMatch(id: string, updates: Partial<MusicMatch>): Promise<MusicMatch | undefined>;

  // Platform Connections
  getPlatformConnections(userId: string): Promise<PlatformConnection[]>;
  getPlatformConnection(id: string): Promise<PlatformConnection | undefined>;
  createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection>;
  updatePlatformConnection(id: string, updates: Partial<PlatformConnection>): Promise<PlatformConnection | undefined>;
  deletePlatformConnection(id: string): Promise<boolean>;

  // Scheduled Publishes
  getScheduledPublishes(projectId?: string): Promise<ScheduledPublish[]>;
  createScheduledPublish(publish: InsertScheduledPublish): Promise<ScheduledPublish>;
  updateScheduledPublish(id: string, updates: Partial<ScheduledPublish>): Promise<ScheduledPublish | undefined>;
  deleteScheduledPublish(id: string): Promise<boolean>;

  // Platform Formats
  getPlatformFormats(projectId: string): Promise<PlatformFormat[]>;
  createPlatformFormat(format: InsertPlatformFormat): Promise<PlatformFormat>;
  updatePlatformFormat(id: string, updates: Partial<PlatformFormat>): Promise<PlatformFormat | undefined>;

  // Project Reviews
  getProjectReviews(projectId: string): Promise<ProjectReview[]>;
  createProjectReview(review: InsertProjectReview): Promise<ProjectReview>;
  updateProjectReview(id: string, updates: Partial<ProjectReview>): Promise<ProjectReview | undefined>;

  // Project Comments
  getProjectComments(projectId: string): Promise<ProjectComment[]>;
  createProjectComment(comment: InsertProjectComment): Promise<ProjectComment>;
  updateProjectComment(id: string, updates: Partial<ProjectComment>): Promise<ProjectComment | undefined>;
  deleteProjectComment(id: string): Promise<boolean>;

  // Exports
  getExports(): Promise<Export[]>;
  getExport(id: string): Promise<Export | undefined>;
  createExport(exportData: InsertExport): Promise<Export>;
  updateExport(id: string, updates: Partial<Export>): Promise<Export | undefined>;
  getExportsByProject(projectId: string): Promise<Export[]>;

  // Template Purchases
  getTemplatePurchases(userId: string): Promise<TemplatePurchase[]>;
  createTemplatePurchase(purchase: InsertTemplatePurchase): Promise<TemplatePurchase>;
  hasUserPurchasedTemplate(userId: string, templateId: string): Promise<boolean>;

  // Template Reviews
  getTemplateReviews(templateId: string): Promise<TemplateReview[]>;
  createTemplateReview(review: InsertTemplateReview): Promise<TemplateReview>;

  // Analytics Events
  getAnalyticsEvents(userId?: string): Promise<AnalyticsEvent[]>;
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsSummary(userId?: string): Promise<{
    totalProjects: number;
    totalTimeSaved: number;
    videosProcessed: number;
    storageUsed: number;
  }>;

  // Watch Folders
  getWatchFolders(userId: string): Promise<WatchFolder[]>;
  getWatchFolder(id: string): Promise<WatchFolder | undefined>;
  createWatchFolder(folder: InsertWatchFolder): Promise<WatchFolder>;
  updateWatchFolder(id: string, updates: Partial<WatchFolder>): Promise<WatchFolder | undefined>;
  deleteWatchFolder(id: string): Promise<boolean>;

  // Batch Jobs
  getBatchJobs(userId: string): Promise<BatchJob[]>;
  getBatchJob(id: string): Promise<BatchJob | undefined>;
  createBatchJob(job: InsertBatchJob): Promise<BatchJob>;
  updateBatchJob(id: string, updates: Partial<BatchJob>): Promise<BatchJob | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private teams: Map<string, Team> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private styleTemplates: Map<string, StyleTemplate> = new Map();
  private personalityPresets: Map<string, PersonalityPreset> = new Map();
  private brandVoiceTemplates: Map<string, BrandVoiceTemplate> = new Map();
  private projects: Map<string, Project> = new Map();
  private projectVersions: Map<string, ProjectVersion> = new Map();
  private brandAssets: Map<string, BrandAsset> = new Map();
  private processingJobs: Map<string, ProcessingJob> = new Map();
  private aiAnalysisResults: Map<string, AiAnalysisResult> = new Map();
  private transcriptions: Map<string, Transcription> = new Map();
  private bRollSuggestions: Map<string, BRollSuggestion> = new Map();
  private voiceClones: Map<string, VoiceClone> = new Map();
  private generatedThumbnails: Map<string, GeneratedThumbnail> = new Map();
  private musicTracks: Map<string, MusicTrack> = new Map();
  private musicMatches: Map<string, MusicMatch> = new Map();
  private platformConnections: Map<string, PlatformConnection> = new Map();
  private scheduledPublishes: Map<string, ScheduledPublish> = new Map();
  private platformFormats: Map<string, PlatformFormat> = new Map();
  private projectReviews: Map<string, ProjectReview> = new Map();
  private projectComments: Map<string, ProjectComment> = new Map();
  private exports: Map<string, Export> = new Map();
  private templatePurchases: Map<string, TemplatePurchase> = new Map();
  private templateReviews: Map<string, TemplateReview> = new Map();
  private analyticsEvents: Map<string, AnalyticsEvent> = new Map();
  private watchFolders: Map<string, WatchFolder> = new Map();
  private batchJobs: Map<string, BatchJob> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default style templates
    const templates: StyleTemplate[] = [
      {
        id: randomUUID(),
        name: "Corporate Clean",
        description: "Professional, minimal branding for business content",
        icon: "fas fa-building",
        colorScheme: "blue",
        category: "corporate",
        isPublic: true,
        isMarketplace: true,
        price: 0,
        authorId: null,
        thumbnailUrl: null,
        settings: {
          cutFrequency: 3,
          transitionType: "fade",
          musicStyle: "corporate",
          textStyle: "minimal",
          brandingPosition: "bottom-right",
          pacing: "moderate"
        },
        usageCount: 124,
        rating: 4.5,
        reviewCount: 28,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "YouTube Format",
        description: "Engaging, dynamic cuts for maximum retention",
        icon: "fas fa-play",
        colorScheme: "red",
        category: "youtube",
        isPublic: true,
        isMarketplace: true,
        price: 0,
        authorId: null,
        thumbnailUrl: null,
        settings: {
          cutFrequency: 8,
          transitionType: "quick-cuts",
          musicStyle: "upbeat",
          textStyle: "bold",
          brandingPosition: "top-left",
          pacing: "fast"
        },
        usageCount: 256,
        rating: 4.8,
        reviewCount: 45,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Podcast Standard",
        description: "Audio-focused with chapter markers and timestamps",
        icon: "fas fa-microphone",
        colorScheme: "purple",
        category: "podcast",
        isPublic: true,
        isMarketplace: true,
        price: 0,
        authorId: null,
        thumbnailUrl: null,
        settings: {
          cutFrequency: 2,
          transitionType: "crossfade",
          musicStyle: "ambient",
          textStyle: "subtitle",
          brandingPosition: "center",
          pacing: "slow"
        },
        usageCount: 89,
        rating: 4.3,
        reviewCount: 18,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "TikTok Viral",
        description: "Fast-paced edits optimized for short-form content",
        icon: "fas fa-bolt",
        colorScheme: "pink",
        category: "tiktok",
        isPublic: true,
        isMarketplace: true,
        price: 4.99,
        authorId: null,
        thumbnailUrl: null,
        settings: {
          cutFrequency: 12,
          transitionType: "zoom-cut",
          musicStyle: "trending",
          textStyle: "animated",
          brandingPosition: "top-right",
          pacing: "very-fast"
        },
        usageCount: 512,
        rating: 4.9,
        reviewCount: 89,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Documentary Style",
        description: "Cinematic storytelling with smooth transitions",
        icon: "fas fa-film",
        colorScheme: "gray",
        category: "general",
        isPublic: true,
        isMarketplace: true,
        price: 9.99,
        authorId: null,
        thumbnailUrl: null,
        settings: {
          cutFrequency: 4,
          transitionType: "dissolve",
          musicStyle: "cinematic",
          textStyle: "elegant",
          brandingPosition: "bottom-left",
          pacing: "slow"
        },
        usageCount: 67,
        rating: 4.7,
        reviewCount: 12,
        createdAt: new Date(),
      }
    ];

    templates.forEach(template => this.styleTemplates.set(template.id, template));

    // Create personality presets
    const presets: PersonalityPreset[] = [
      {
        id: randomUUID(),
        name: "MrBeast Style",
        description: "High-energy, fast cuts, dramatic zooms, engaging text overlays",
        creatorName: "MrBeast",
        learnedPatterns: {
          avgCutDuration: 2.5,
          transitionPreferences: ["hard-cut", "zoom-in", "zoom-out"],
          zoomPatterns: ["emphasis", "reaction", "reveal"],
          textAnimations: ["pop-in", "shake", "scale-up"],
          colorGrading: "vibrant",
          paceProfile: [8, 10, 12, 8, 10]
        },
        sourceVideoCount: 50,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "MKBHD Style",
        description: "Clean, minimal, professional tech review aesthetic",
        creatorName: "MKBHD",
        learnedPatterns: {
          avgCutDuration: 4.0,
          transitionPreferences: ["fade", "slide", "wipe"],
          zoomPatterns: ["product-focus", "detail-shot"],
          textAnimations: ["fade-in", "slide-up"],
          colorGrading: "cinematic",
          paceProfile: [4, 5, 4, 5, 4]
        },
        sourceVideoCount: 35,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Casey Neistat Style",
        description: "Vlog style with creative b-roll and time-lapses",
        creatorName: "Casey Neistat",
        learnedPatterns: {
          avgCutDuration: 3.0,
          transitionPreferences: ["hard-cut", "time-lapse", "hyperlapse"],
          zoomPatterns: ["action", "establishing", "detail"],
          textAnimations: ["handwritten", "sketch"],
          colorGrading: "warm",
          paceProfile: [6, 7, 8, 6, 7]
        },
        sourceVideoCount: 42,
        createdAt: new Date(),
      }
    ];

    presets.forEach(preset => this.personalityPresets.set(preset.id, preset));

    // Create sample brand assets
    const assets: BrandAsset[] = [
      {
        id: randomUUID(),
        name: "Primary Logo",
        type: "logo",
        filePath: null,
        teamId: null,
        metadata: {},
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Primary Brand Colors",
        type: "colorScheme",
        filePath: null,
        teamId: null,
        metadata: {
          colors: ["#3b82f6", "#60a5fa", "#1f2937"]
        },
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Energetic Colors",
        type: "colorScheme",
        filePath: null,
        teamId: null,
        metadata: {
          colors: ["#ef4444", "#fb923c", "#fbbf24"]
        },
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Montserrat Bold",
        type: "font",
        filePath: null,
        teamId: null,
        metadata: {
          fontFamily: "Montserrat",
          fontWeight: "700"
        },
        createdAt: new Date(),
      }
    ];

    assets.forEach(asset => this.brandAssets.set(asset.id, asset));

    // Create sample music tracks
    const tracks: MusicTrack[] = [
      {
        id: randomUUID(),
        name: "Corporate Success",
        artistName: "AudioStock",
        genre: "corporate",
        mood: "upbeat",
        tempo: 120,
        duration: 180,
        audioUrl: null,
        previewUrl: null,
        license: "royalty-free",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Chill Vibes",
        artistName: "LoFi Productions",
        genre: "lo-fi",
        mood: "calm",
        tempo: 85,
        duration: 240,
        audioUrl: null,
        previewUrl: null,
        license: "royalty-free",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Epic Cinematic",
        artistName: "Orchestral Sounds",
        genre: "cinematic",
        mood: "dramatic",
        tempo: 100,
        duration: 210,
        audioUrl: null,
        previewUrl: null,
        license: "royalty-free",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Trending Pop Beat",
        artistName: "TikTok Beats",
        genre: "pop",
        mood: "energetic",
        tempo: 128,
        duration: 150,
        audioUrl: null,
        previewUrl: null,
        license: "royalty-free",
        createdAt: new Date(),
      }
    ];

    tracks.forEach(track => this.musicTracks.set(track.id, track));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Teams
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam = {
      ...team,
      id,
      description: team.description ?? null,
      plan: team.plan ?? null,
      whiteLabelEnabled: team.whiteLabelEnabled ?? null,
      customBranding: team.customBranding ?? null,
      createdAt: new Date(),
    } as Team;
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    const updated = { ...team, ...updates };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Team Members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(m => m.teamId === teamId);
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const newMember = {
      ...member,
      id,
      role: member.role ?? null,
      invitedAt: new Date(),
      joinedAt: null,
    } as TeamMember;
    this.teamMembers.set(id, newMember);
    return newMember;
  }

  async removeTeamMember(id: string): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const member = this.teamMembers.get(id);
    if (!member) return undefined;
    const updated = { ...member, ...updates };
    this.teamMembers.set(id, updated);
    return updated;
  }

  // Style Templates
  async getStyleTemplates(): Promise<StyleTemplate[]> {
    return Array.from(this.styleTemplates.values()).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }

  async getStyleTemplate(id: string): Promise<StyleTemplate | undefined> {
    return this.styleTemplates.get(id);
  }

  async getMarketplaceTemplates(): Promise<StyleTemplate[]> {
    return Array.from(this.styleTemplates.values())
      .filter(t => t.isMarketplace)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  async createStyleTemplate(template: InsertStyleTemplate): Promise<StyleTemplate> {
    const id = randomUUID();
    const newTemplate = {
      ...template,
      id,
      description: template.description ?? null,
      icon: template.icon ?? null,
      colorScheme: template.colorScheme ?? null,
      category: template.category ?? null,
      isPublic: template.isPublic ?? null,
      isMarketplace: template.isMarketplace ?? null,
      price: template.price ?? null,
      authorId: template.authorId ?? null,
      thumbnailUrl: template.thumbnailUrl ?? null,
      usageCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
    } as StyleTemplate;
    this.styleTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateStyleTemplate(id: string, updates: Partial<StyleTemplate>): Promise<StyleTemplate | undefined> {
    const template = this.styleTemplates.get(id);
    if (!template) return undefined;
    const updated = { ...template, ...updates };
    this.styleTemplates.set(id, updated);
    return updated;
  }

  async deleteStyleTemplate(id: string): Promise<boolean> {
    return this.styleTemplates.delete(id);
  }

  // Personality Presets
  async getPersonalityPresets(): Promise<PersonalityPreset[]> {
    return Array.from(this.personalityPresets.values());
  }

  async getPersonalityPreset(id: string): Promise<PersonalityPreset | undefined> {
    return this.personalityPresets.get(id);
  }

  async createPersonalityPreset(preset: InsertPersonalityPreset): Promise<PersonalityPreset> {
    const id = randomUUID();
    const newPreset = {
      ...preset,
      id,
      description: preset.description ?? null,
      creatorName: preset.creatorName ?? null,
      learnedPatterns: preset.learnedPatterns ?? null,
      sourceVideoCount: preset.sourceVideoCount ?? null,
      createdAt: new Date(),
    } as PersonalityPreset;
    this.personalityPresets.set(id, newPreset);
    return newPreset;
  }

  async updatePersonalityPreset(id: string, updates: Partial<PersonalityPreset>): Promise<PersonalityPreset | undefined> {
    const preset = this.personalityPresets.get(id);
    if (!preset) return undefined;
    const updated = { ...preset, ...updates };
    this.personalityPresets.set(id, updated);
    return updated;
  }

  async deletePersonalityPreset(id: string): Promise<boolean> {
    return this.personalityPresets.delete(id);
  }

  // Brand Voice Templates
  async getBrandVoiceTemplates(userId?: string): Promise<BrandVoiceTemplate[]> {
    const templates = Array.from(this.brandVoiceTemplates.values());
    if (userId) {
      return templates.filter(t => t.userId === userId);
    }
    return templates;
  }

  async getBrandVoiceTemplate(id: string): Promise<BrandVoiceTemplate | undefined> {
    return this.brandVoiceTemplates.get(id);
  }

  async createBrandVoiceTemplate(template: InsertBrandVoiceTemplate): Promise<BrandVoiceTemplate> {
    const id = randomUUID();
    const newTemplate = {
      ...template,
      id,
      userId: template.userId ?? null,
      introPattern: template.introPattern ?? null,
      outroPattern: template.outroPattern ?? null,
      lowerThirdsStyle: template.lowerThirdsStyle ?? null,
      graphicTreatments: template.graphicTreatments ?? null,
      createdAt: new Date(),
    } as BrandVoiceTemplate;
    this.brandVoiceTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateBrandVoiceTemplate(id: string, updates: Partial<BrandVoiceTemplate>): Promise<BrandVoiceTemplate | undefined> {
    const template = this.brandVoiceTemplates.get(id);
    if (!template) return undefined;
    const updated = { ...template, ...updates };
    this.brandVoiceTemplates.set(id, updated);
    return updated;
  }

  async deleteBrandVoiceTemplate(id: string): Promise<boolean> {
    return this.brandVoiceTemplates.delete(id);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByTeam(teamId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.teamId === teamId);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const newProject = {
      ...project,
      id,
      description: project.description ?? null,
      originalVideoPath: project.originalVideoPath ?? null,
      processedVideoPath: project.processedVideoPath ?? null,
      thumbnailPath: project.thumbnailPath ?? null,
      styleTemplateId: project.styleTemplateId ?? null,
      brandVoiceTemplateId: project.brandVoiceTemplateId ?? null,
      teamId: project.teamId ?? null,
      status: project.status ?? "pending",
      duration: project.duration ?? null,
      fileSize: project.fileSize ?? null,
      progress: 0,
      estimatedTimeLeft: project.estimatedTimeLeft ?? null,
      processingOptions: project.processingOptions ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Project Versions
  async getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
    return Array.from(this.projectVersions.values())
      .filter(v => v.projectId === projectId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async createProjectVersion(version: InsertProjectVersion): Promise<ProjectVersion> {
    const id = randomUUID();
    const newVersion = {
      ...version,
      id,
      videoPath: version.videoPath ?? null,
      changes: version.changes ?? null,
      createdById: version.createdById ?? null,
      createdAt: new Date(),
    } as ProjectVersion;
    this.projectVersions.set(id, newVersion);
    return newVersion;
  }

  // Brand Assets
  async getBrandAssets(): Promise<BrandAsset[]> {
    return Array.from(this.brandAssets.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getBrandAsset(id: string): Promise<BrandAsset | undefined> {
    return this.brandAssets.get(id);
  }

  async getBrandAssetsByTeam(teamId: string): Promise<BrandAsset[]> {
    return Array.from(this.brandAssets.values()).filter(a => a.teamId === teamId);
  }

  async createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset> {
    const id = randomUUID();
    const newAsset = {
      ...asset,
      id,
      filePath: asset.filePath ?? null,
      teamId: asset.teamId ?? null,
      metadata: asset.metadata ?? null,
      createdAt: new Date(),
    } as BrandAsset;
    this.brandAssets.set(id, newAsset);
    return newAsset;
  }

  async updateBrandAsset(id: string, updates: Partial<BrandAsset>): Promise<BrandAsset | undefined> {
    const asset = this.brandAssets.get(id);
    if (!asset) return undefined;
    const updated = { ...asset, ...updates };
    this.brandAssets.set(id, updated);
    return updated;
  }

  async deleteBrandAsset(id: string): Promise<boolean> {
    return this.brandAssets.delete(id);
  }

  // Processing Jobs
  async getProcessingJobs(): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getProcessingJob(id: string): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
    const id = randomUUID();
    const newJob = {
      ...job,
      id,
      projectId: job.projectId ?? null,
      status: job.status ?? "queued",
      progress: 0,
      estimatedTimeLeft: job.estimatedTimeLeft ?? null,
      currentStep: job.currentStep ?? null,
      errorMessage: job.errorMessage ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ProcessingJob;
    this.processingJobs.set(id, newJob);
    return newJob;
  }

  async updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined> {
    const job = this.processingJobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates, updatedAt: new Date() };
    this.processingJobs.set(id, updated);
    return updated;
  }

  async getActiveProcessingJobs(): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values())
      .filter(job => job.status === 'processing' || job.status === 'queued')
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }

  // AI Analysis Results
  async getAiAnalysisResults(projectId: string): Promise<AiAnalysisResult[]> {
    return Array.from(this.aiAnalysisResults.values()).filter(r => r.projectId === projectId);
  }

  async createAiAnalysisResult(result: InsertAiAnalysisResult): Promise<AiAnalysisResult> {
    const id = randomUUID();
    const newResult = {
      ...result,
      id,
      results: result.results ?? null,
      confidence: result.confidence ?? null,
      status: result.status ?? null,
      createdAt: new Date(),
    } as AiAnalysisResult;
    this.aiAnalysisResults.set(id, newResult);
    return newResult;
  }

  async updateAiAnalysisResult(id: string, updates: Partial<AiAnalysisResult>): Promise<AiAnalysisResult | undefined> {
    const result = this.aiAnalysisResults.get(id);
    if (!result) return undefined;
    const updated = { ...result, ...updates };
    this.aiAnalysisResults.set(id, updated);
    return updated;
  }

  // Transcriptions
  async getTranscription(projectId: string): Promise<Transcription | undefined> {
    return Array.from(this.transcriptions.values()).find(t => t.projectId === projectId);
  }

  async createTranscription(transcription: InsertTranscription): Promise<Transcription> {
    const id = randomUUID();
    const newTranscription = {
      ...transcription,
      id,
      text: transcription.text ?? null,
      segments: transcription.segments ?? null,
      language: transcription.language ?? null,
      captionStyle: transcription.captionStyle ?? null,
      status: transcription.status ?? null,
      createdAt: new Date(),
    } as Transcription;
    this.transcriptions.set(id, newTranscription);
    return newTranscription;
  }

  async updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription | undefined> {
    const transcription = this.transcriptions.get(id);
    if (!transcription) return undefined;
    const updated = { ...transcription, ...updates };
    this.transcriptions.set(id, updated);
    return updated;
  }

  // B-Roll Suggestions
  async getBRollSuggestions(projectId: string): Promise<BRollSuggestion[]> {
    return Array.from(this.bRollSuggestions.values()).filter(s => s.projectId === projectId);
  }

  async createBRollSuggestion(suggestion: InsertBRollSuggestion): Promise<BRollSuggestion> {
    const id = randomUUID();
    const newSuggestion = {
      ...suggestion,
      id,
      duration: suggestion.duration ?? null,
      keyword: suggestion.keyword ?? null,
      suggestions: suggestion.suggestions ?? null,
      selectedUrl: suggestion.selectedUrl ?? null,
      createdAt: new Date(),
    } as BRollSuggestion;
    this.bRollSuggestions.set(id, newSuggestion);
    return newSuggestion;
  }

  async updateBRollSuggestion(id: string, updates: Partial<BRollSuggestion>): Promise<BRollSuggestion | undefined> {
    const suggestion = this.bRollSuggestions.get(id);
    if (!suggestion) return undefined;
    const updated = { ...suggestion, ...updates };
    this.bRollSuggestions.set(id, updated);
    return updated;
  }

  // Voice Clones
  async getVoiceClones(userId: string): Promise<VoiceClone[]> {
    return Array.from(this.voiceClones.values()).filter(v => v.userId === userId);
  }

  async createVoiceClone(clone: InsertVoiceClone): Promise<VoiceClone> {
    const id = randomUUID();
    const newClone = {
      ...clone,
      id,
      status: clone.status ?? null,
      sampleAudioPaths: clone.sampleAudioPaths ?? null,
      voiceId: clone.voiceId ?? null,
      createdAt: new Date(),
    } as VoiceClone;
    this.voiceClones.set(id, newClone);
    return newClone;
  }

  async updateVoiceClone(id: string, updates: Partial<VoiceClone>): Promise<VoiceClone | undefined> {
    const clone = this.voiceClones.get(id);
    if (!clone) return undefined;
    const updated = { ...clone, ...updates };
    this.voiceClones.set(id, updated);
    return updated;
  }

  async deleteVoiceClone(id: string): Promise<boolean> {
    return this.voiceClones.delete(id);
  }

  // Generated Thumbnails
  async getGeneratedThumbnails(projectId: string): Promise<GeneratedThumbnail[]> {
    return Array.from(this.generatedThumbnails.values())
      .filter(t => t.projectId === projectId)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  async createGeneratedThumbnail(thumbnail: InsertGeneratedThumbnail): Promise<GeneratedThumbnail> {
    const id = randomUUID();
    const newThumbnail = {
      ...thumbnail,
      id,
      imageUrl: thumbnail.imageUrl ?? null,
      score: thumbnail.score ?? null,
      elements: thumbnail.elements ?? null,
      selected: thumbnail.selected ?? null,
      createdAt: new Date(),
    } as GeneratedThumbnail;
    this.generatedThumbnails.set(id, newThumbnail);
    return newThumbnail;
  }

  async updateGeneratedThumbnail(id: string, updates: Partial<GeneratedThumbnail>): Promise<GeneratedThumbnail | undefined> {
    const thumbnail = this.generatedThumbnails.get(id);
    if (!thumbnail) return undefined;
    const updated = { ...thumbnail, ...updates };
    this.generatedThumbnails.set(id, updated);
    return updated;
  }

  // Music Tracks
  async getMusicTracks(): Promise<MusicTrack[]> {
    return Array.from(this.musicTracks.values());
  }

  async getMusicTracksByMood(mood: string): Promise<MusicTrack[]> {
    return Array.from(this.musicTracks.values()).filter(t => t.mood === mood);
  }

  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const id = randomUUID();
    const newTrack = {
      ...track,
      id,
      duration: track.duration ?? null,
      mood: track.mood ?? null,
      artistName: track.artistName ?? null,
      genre: track.genre ?? null,
      tempo: track.tempo ?? null,
      audioUrl: track.audioUrl ?? null,
      previewUrl: track.previewUrl ?? null,
      license: track.license ?? null,
      createdAt: new Date(),
    } as MusicTrack;
    this.musicTracks.set(id, newTrack);
    return newTrack;
  }

  // Music Matches
  async getMusicMatches(projectId: string): Promise<MusicMatch[]> {
    return Array.from(this.musicMatches.values())
      .filter(m => m.projectId === projectId)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  async createMusicMatch(match: InsertMusicMatch): Promise<MusicMatch> {
    const id = randomUUID();
    const newMatch = {
      ...match,
      id,
      matchScore: match.matchScore ?? null,
      energyAlignment: match.energyAlignment ?? null,
      selected: match.selected ?? null,
      createdAt: new Date(),
    } as MusicMatch;
    this.musicMatches.set(id, newMatch);
    return newMatch;
  }

  async updateMusicMatch(id: string, updates: Partial<MusicMatch>): Promise<MusicMatch | undefined> {
    const match = this.musicMatches.get(id);
    if (!match) return undefined;
    const updated = { ...match, ...updates };
    this.musicMatches.set(id, updated);
    return updated;
  }

  // Platform Connections
  async getPlatformConnections(userId: string): Promise<PlatformConnection[]> {
    return Array.from(this.platformConnections.values()).filter(c => c.userId === userId);
  }

  async getPlatformConnection(id: string): Promise<PlatformConnection | undefined> {
    return this.platformConnections.get(id);
  }

  async createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection> {
    const id = randomUUID();
    const newConnection = {
      ...connection,
      id,
      accessToken: connection.accessToken ?? null,
      refreshToken: connection.refreshToken ?? null,
      channelId: connection.channelId ?? null,
      channelName: connection.channelName ?? null,
      isActive: connection.isActive ?? null,
      expiresAt: connection.expiresAt ?? null,
      connectedAt: new Date(),
    } as PlatformConnection;
    this.platformConnections.set(id, newConnection);
    return newConnection;
  }

  async updatePlatformConnection(id: string, updates: Partial<PlatformConnection>): Promise<PlatformConnection | undefined> {
    const connection = this.platformConnections.get(id);
    if (!connection) return undefined;
    const updated = { ...connection, ...updates };
    this.platformConnections.set(id, updated);
    return updated;
  }

  async deletePlatformConnection(id: string): Promise<boolean> {
    return this.platformConnections.delete(id);
  }

  // Scheduled Publishes
  async getScheduledPublishes(projectId?: string): Promise<ScheduledPublish[]> {
    let publishes = Array.from(this.scheduledPublishes.values());
    if (projectId) {
      publishes = publishes.filter(p => p.projectId === projectId);
    }
    return publishes.sort((a, b) => 
      new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime()
    );
  }

  async createScheduledPublish(publish: InsertScheduledPublish): Promise<ScheduledPublish> {
    const id = randomUUID();
    const newPublish = {
      ...publish,
      id,
      status: publish.status ?? null,
      title: publish.title ?? null,
      description: publish.description ?? null,
      tags: publish.tags ?? null,
      visibility: publish.visibility ?? null,
      publishedUrl: publish.publishedUrl ?? null,
      platformVideoId: publish.platformVideoId ?? null,
      createdAt: new Date(),
    } as ScheduledPublish;
    this.scheduledPublishes.set(id, newPublish);
    return newPublish;
  }

  async updateScheduledPublish(id: string, updates: Partial<ScheduledPublish>): Promise<ScheduledPublish | undefined> {
    const publish = this.scheduledPublishes.get(id);
    if (!publish) return undefined;
    const updated = { ...publish, ...updates };
    this.scheduledPublishes.set(id, updated);
    return updated;
  }

  async deleteScheduledPublish(id: string): Promise<boolean> {
    return this.scheduledPublishes.delete(id);
  }

  // Platform Formats
  async getPlatformFormats(projectId: string): Promise<PlatformFormat[]> {
    return Array.from(this.platformFormats.values()).filter(f => f.projectId === projectId);
  }

  async createPlatformFormat(format: InsertPlatformFormat): Promise<PlatformFormat> {
    const id = randomUUID();
    const newFormat = {
      ...format,
      id,
      aspectRatio: format.aspectRatio ?? null,
      resolution: format.resolution ?? null,
      videoPath: format.videoPath ?? null,
      status: format.status ?? null,
      createdAt: new Date(),
    } as PlatformFormat;
    this.platformFormats.set(id, newFormat);
    return newFormat;
  }

  async updatePlatformFormat(id: string, updates: Partial<PlatformFormat>): Promise<PlatformFormat | undefined> {
    const format = this.platformFormats.get(id);
    if (!format) return undefined;
    const updated = { ...format, ...updates };
    this.platformFormats.set(id, updated);
    return updated;
  }

  // Project Reviews
  async getProjectReviews(projectId: string): Promise<ProjectReview[]> {
    return Array.from(this.projectReviews.values())
      .filter(r => r.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createProjectReview(review: InsertProjectReview): Promise<ProjectReview> {
    const id = randomUUID();
    const newReview = {
      ...review,
      id,
      status: review.status ?? null,
      feedback: review.feedback ?? null,
      timestamp: review.timestamp ?? null,
      createdAt: new Date(),
    } as ProjectReview;
    this.projectReviews.set(id, newReview);
    return newReview;
  }

  async updateProjectReview(id: string, updates: Partial<ProjectReview>): Promise<ProjectReview | undefined> {
    const review = this.projectReviews.get(id);
    if (!review) return undefined;
    const updated = { ...review, ...updates };
    this.projectReviews.set(id, updated);
    return updated;
  }

  // Project Comments
  async getProjectComments(projectId: string): Promise<ProjectComment[]> {
    return Array.from(this.projectComments.values())
      .filter(c => c.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }

  async createProjectComment(comment: InsertProjectComment): Promise<ProjectComment> {
    const id = randomUUID();
    const newComment = {
      ...comment,
      id,
      userId: comment.userId ?? null,
      timestamp: comment.timestamp ?? null,
      resolved: comment.resolved ?? null,
      createdAt: new Date(),
    } as ProjectComment;
    this.projectComments.set(id, newComment);
    return newComment;
  }

  async updateProjectComment(id: string, updates: Partial<ProjectComment>): Promise<ProjectComment | undefined> {
    const comment = this.projectComments.get(id);
    if (!comment) return undefined;
    const updated = { ...comment, ...updates };
    this.projectComments.set(id, updated);
    return updated;
  }

  async deleteProjectComment(id: string): Promise<boolean> {
    return this.projectComments.delete(id);
  }

  // Exports
  async getExports(): Promise<Export[]> {
    return Array.from(this.exports.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getExport(id: string): Promise<Export | undefined> {
    return this.exports.get(id);
  }

  async createExport(exportData: InsertExport): Promise<Export> {
    const id = randomUUID();
    const newExport = {
      ...exportData,
      id,
      projectId: exportData.projectId ?? null,
      aspectRatio: exportData.aspectRatio ?? null,
      filePath: exportData.filePath ?? null,
      fileSize: exportData.fileSize ?? null,
      status: exportData.status ?? "pending",
      whiteLabelEnabled: exportData.whiteLabelEnabled ?? null,
      createdAt: new Date(),
    } as Export;
    this.exports.set(id, newExport);
    return newExport;
  }

  async updateExport(id: string, updates: Partial<Export>): Promise<Export | undefined> {
    const exportData = this.exports.get(id);
    if (!exportData) return undefined;
    const updated = { ...exportData, ...updates };
    this.exports.set(id, updated);
    return updated;
  }

  async getExportsByProject(projectId: string): Promise<Export[]> {
    return Array.from(this.exports.values())
      .filter(exp => exp.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  // Template Purchases
  async getTemplatePurchases(userId: string): Promise<TemplatePurchase[]> {
    return Array.from(this.templatePurchases.values()).filter(p => p.buyerId === userId);
  }

  async createTemplatePurchase(purchase: InsertTemplatePurchase): Promise<TemplatePurchase> {
    const id = randomUUID();
    const newPurchase = {
      ...purchase,
      id,
      transactionId: purchase.transactionId ?? null,
      purchasedAt: new Date(),
    } as TemplatePurchase;
    this.templatePurchases.set(id, newPurchase);
    return newPurchase;
  }

  async hasUserPurchasedTemplate(userId: string, templateId: string): Promise<boolean> {
    return Array.from(this.templatePurchases.values()).some(
      p => p.buyerId === userId && p.templateId === templateId
    );
  }

  // Template Reviews
  async getTemplateReviews(templateId: string): Promise<TemplateReview[]> {
    return Array.from(this.templateReviews.values())
      .filter(r => r.templateId === templateId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createTemplateReview(review: InsertTemplateReview): Promise<TemplateReview> {
    const id = randomUUID();
    const newReview = {
      ...review,
      id,
      review: review.review ?? null,
      createdAt: new Date(),
    } as TemplateReview;
    this.templateReviews.set(id, newReview);
    return newReview;
  }

  // Analytics Events
  async getAnalyticsEvents(userId?: string): Promise<AnalyticsEvent[]> {
    let events = Array.from(this.analyticsEvents.values());
    if (userId) {
      events = events.filter(e => e.userId === userId);
    }
    return events.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const id = randomUUID();
    const newEvent = {
      ...event,
      id,
      userId: event.userId ?? null,
      projectId: event.projectId ?? null,
      metadata: event.metadata ?? null,
      timeSavedMinutes: event.timeSavedMinutes ?? null,
      createdAt: new Date(),
    } as AnalyticsEvent;
    this.analyticsEvents.set(id, newEvent);
    return newEvent;
  }

  async getAnalyticsSummary(userId?: string): Promise<{
    totalProjects: number;
    totalTimeSaved: number;
    videosProcessed: number;
    storageUsed: number;
  }> {
    const projects = await this.getProjects();
    const completedProjects = projects.filter(p => p.status === 'completed');
    const totalTimeSaved = Array.from(this.analyticsEvents.values())
      .reduce((sum, e) => sum + (e.timeSavedMinutes || 0), 0);
    const storageUsed = projects.reduce((sum, p) => sum + (p.fileSize || 0), 0);

    return {
      totalProjects: projects.length,
      totalTimeSaved,
      videosProcessed: completedProjects.length,
      storageUsed
    };
  }

  // Watch Folders
  async getWatchFolders(userId: string): Promise<WatchFolder[]> {
    return Array.from(this.watchFolders.values()).filter(f => f.userId === userId);
  }

  async getWatchFolder(id: string): Promise<WatchFolder | undefined> {
    return this.watchFolders.get(id);
  }

  async createWatchFolder(folder: InsertWatchFolder): Promise<WatchFolder> {
    const id = randomUUID();
    const newFolder = {
      ...folder,
      id,
      isActive: folder.isActive ?? null,
      styleTemplateId: folder.styleTemplateId ?? null,
      autoProcess: folder.autoProcess ?? null,
      outputFormat: folder.outputFormat ?? null,
      createdAt: new Date(),
    } as WatchFolder;
    this.watchFolders.set(id, newFolder);
    return newFolder;
  }

  async updateWatchFolder(id: string, updates: Partial<WatchFolder>): Promise<WatchFolder | undefined> {
    const folder = this.watchFolders.get(id);
    if (!folder) return undefined;
    const updated = { ...folder, ...updates };
    this.watchFolders.set(id, updated);
    return updated;
  }

  async deleteWatchFolder(id: string): Promise<boolean> {
    return this.watchFolders.delete(id);
  }

  // Batch Jobs
  async getBatchJobs(userId: string): Promise<BatchJob[]> {
    return Array.from(this.batchJobs.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getBatchJob(id: string): Promise<BatchJob | undefined> {
    return this.batchJobs.get(id);
  }

  async createBatchJob(job: InsertBatchJob): Promise<BatchJob> {
    const id = randomUUID();
    const newJob = {
      ...job,
      id,
      name: job.name ?? null,
      status: job.status ?? null,
      progress: job.progress ?? null,
      totalItems: job.totalItems ?? null,
      completedItems: job.completedItems ?? null,
      styleTemplateId: job.styleTemplateId ?? null,
      projectIds: job.projectIds ?? null,
      createdAt: new Date(),
    } as BatchJob;
    this.batchJobs.set(id, newJob);
    return newJob;
  }

  async updateBatchJob(id: string, updates: Partial<BatchJob>): Promise<BatchJob | undefined> {
    const job = this.batchJobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    this.batchJobs.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
