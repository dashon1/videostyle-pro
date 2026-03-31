# VideoStyle Pro

## Overview

VideoStyle Pro is a full-stack web application for automated video processing and styling. The platform allows users to upload videos, apply style templates for automatic editing, and export processed videos. Built with a modern React frontend and Express backend, it features a comprehensive video processing workflow with real-time job tracking and brand asset management.

**Latest Update**: Added 25 advanced features including AI-powered editing, style learning, smart automation, platform integration, collaboration tools, and monetization capabilities.

**Recent UX Improvements**:
- Added prominent "View Results" (blue) and "Download" (purple) buttons on completed project cards
- Created project detail page (/projects/:id) showing all AI analysis results
- Implemented auto-polling: UI automatically updates every 2 seconds during processing (no manual refresh needed)

**Video Editor** (Multi-Scene):
- Browser-based video editor at `/editor/:id` — CapCut-like multi-clip editing experience
- **Multi-scene timeline**: Add multiple video clips as scenes, reorder (up/down arrows), rename, remove
- **Add Clip**: Upload additional video clips directly from the editor — files go to object storage, appear as new scenes
- **Per-scene editing**: Each scene has independent trim, cuts, volume, and text overlays
- **Global filters**: Brightness/contrast/saturation and presets (grayscale, sepia, warm, cool, vintage) apply across all scenes
- **Auto-advance playback**: When one scene finishes, playback continues to the next automatically
- **Color-coded timeline**: Each scene gets a unique color block; cuts shown in red, trim shown as bar, text overlays in yellow
- **Export**: FFmpeg.wasm processes each scene (trim+cuts+filters+text+volume), then concatenates all into final MP4
- Undo/redo support with keyboard shortcuts (Space=play/pause, arrows=skip, Ctrl+Z=undo)
- Key files: `client/src/pages/video-editor.tsx`, `client/src/lib/editor-state.ts`, `client/src/lib/video-export.ts`

## User Preferences

Preferred communication style: Simple, everyday language.

## New Feature Categories

### AI Features (/ai/*)
- **Auto-Cut Detection**: AI identifies and removes filler words, pauses, and "ums/ahs"
- **Scene Detection**: Intelligently identifies topic changes and suggests chapter markers
- **B-Roll Suggestions**: AI-powered stock footage recommendations based on video content
- **Voice Clone**: Clone your voice for audio pickups and corrections
- **AI Thumbnails**: Generate click-worthy thumbnails from video highlights

### Style Learning (/style/*)
- **Style Engine**: Analyze existing videos to learn your exact editing patterns
- **Personality Presets**: Import editing styles from popular creators as starting points
- **Brand Voice Templates**: Capture intro/outro patterns, lower thirds, and graphic treatments

### Automation (/automation/*)
- **Transcription & Captions**: Auto-generate captions with custom styling
- **Music Matching**: Auto-select royalty-free music matching your video's energy
- **Batch Processing**: Process multiple videos overnight with the same template
- **Watch Folders**: Auto-start processing when new files are dropped

### Publishing (/publish/*)
- **Platform Connections**: Connect YouTube, TikTok, Instagram, LinkedIn, Twitter
- **Schedule Posts**: Schedule videos for optimal posting times
- **Multi-Format Export**: Auto-resize for different platforms (9:16, 16:9, 1:1)

### Collaboration (/collab/*)
- **Team Workspaces**: Share templates and brand assets with editors/VAs
- **Review & Approval**: Client/team feedback workflow before final export
- **Version History**: Roll back to previous edits easily

### Marketplace (/marketplace)
- **Browse Templates**: Purchase professional editing templates
- **Sell Templates**: Monetize your editing presets
- **Template Reviews**: Rate and review templates

### Analytics (/analytics)
- **Time Saved Tracking**: Monitor productivity improvements
- **Processing Activity**: Track videos processed over time
- **Usage Statistics**: Most used templates and export formats

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing with URL-driven tab state
- **Form Handling**: React Hook Form with Zod validation schemas
- **File Upload**: Uppy integration for robust file upload with progress tracking

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with 80+ endpoints for all features
- **Storage**: In-memory storage (MemStorage) for demo, PostgreSQL-ready schema
- **Schema Management**: Shared TypeScript schemas between frontend and backend using Zod validation

### Database Design
The application schema supports 20+ entities:
- **Users**: Authentication and user management
- **Teams**: Team workspaces with custom branding
- **Team Members**: User-team relationships with roles
- **Style Templates**: Predefined video processing configurations with marketplace support
- **Personality Presets**: Learned editing patterns from creators
- **Brand Voice Templates**: Intro/outro patterns and graphic treatments
- **Projects**: Video processing jobs with status tracking
- **Project Versions**: Version history for rollback
- **Project Reviews**: Approval workflow tracking
- **Project Comments**: Timestamped feedback
- **Brand Assets**: Logos, fonts, color schemes
- **Processing Jobs**: Queue management
- **AI Analysis Results**: Auto-cut, scene detection, suggestions
- **Transcriptions**: Caption data with styling
- **B-Roll Suggestions**: Stock footage recommendations
- **Voice Clones**: Voice model training status
- **Generated Thumbnails**: AI thumbnail options
- **Music Tracks**: Royalty-free music library
- **Music Matches**: Project-track matching scores
- **Platform Connections**: Social media OAuth tokens
- **Scheduled Publishes**: Publishing queue
- **Platform Formats**: Multi-format export jobs
- **Template Purchases**: Marketplace transactions
- **Template Reviews**: Marketplace ratings
- **Watch Folders**: Auto-processing folders
- **Batch Jobs**: Bulk processing status
- **Analytics Events**: Usage tracking
- **Exports**: Export job tracking

### File Storage & Processing
- **Object Storage**: Google Cloud Storage integration with custom ACL system
- **Upload Strategy**: Direct-to-storage uploads using presigned URLs
- **Access Control**: Custom object-level permissions system
- **File Types**: Support for video files, images, fonts, and brand assets

### Navigation Structure
The sidebar uses expandable categories:
- Core: Dashboard, Upload, Projects
- AI Features: Auto-Cut, Scenes, B-Roll, Voice Clone, Thumbnails
- Style Learning: Style Engine, Presets, Brand Voice
- Automation: Transcription, Music, Batch, Watch Folders
- Publishing: Connections, Schedule, Formats
- Collaboration: Teams, Review, Versions
- Additional: Templates, Marketplace, Brand Assets, Analytics, Exports

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless PostgreSQL hosting)
- **Object Storage**: Google Cloud Storage with Replit sidecar authentication
- **Authentication**: Token-based authentication via Replit sidecar endpoint

### Frontend Libraries
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **File Upload**: Uppy with AWS S3 plugin for direct uploads
- **Data Fetching**: TanStack Query for server state management
- **Form Validation**: Zod schemas with React Hook Form integration
- **Date Handling**: date-fns for date manipulation and formatting
- **Icons**: Lucide React and Font Awesome

### Backend Dependencies
- **Database ORM**: Drizzle ORM with PostgreSQL adapter
- **Session Store**: connect-pg-simple for PostgreSQL session storage
- **Cloud Integration**: @google-cloud/storage for object storage operations
- **Validation**: Zod for runtime type checking and validation

### Development Tools
- **Replit Integration**: Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay for development
- **Code Mapping**: Source map support for debugging
