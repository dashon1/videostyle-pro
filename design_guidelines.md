# VideoStyle Pro - Design Guidelines

## Design Approach

**Reference-Based**: Drawing from modern creative SaaS products like Descript, Runway ML, and Figma's collaboration patterns. Dark mode primary with sophisticated UI that balances professional power with creator accessibility.

## Core Design Elements

### Typography
- **Primary**: Inter (Google Fonts) - clean, modern SaaS standard
- **Display/Headers**: DM Sans (Google Fonts) - premium feel for hero/marketing
- **Hierarchy**: 
  - Hero headline: text-5xl/6xl, font-bold
  - Section headers: text-3xl/4xl, font-semibold
  - UI labels: text-sm, font-medium
  - Body: text-base, leading-relaxed

### Layout System
**Spacing Primitives**: Use Tailwind units of 3, 4, 6, 8, 12, 16, 20
- Component padding: p-4, p-6
- Section spacing: py-16, py-20, py-24
- Container max-widths: max-w-7xl for content, max-w-screen-2xl for full layouts

### Component Library

**Navigation**
- Sticky header with backdrop blur (backdrop-blur-md)
- Logo left, centered nav links, right-aligned "Sign In" + "Start Free Trial" CTA
- Mobile: hamburger menu with slide-in drawer

**Hero Section** (Uses Large Hero Image)
- Full viewport height (min-h-screen)
- Background: Dark gradient overlay on cinematic video editing workspace image
- Content: Left-aligned, max-w-3xl
- Primary CTA button with blurred background (backdrop-blur-lg bg-white/10)
- Trust indicators below CTAs: "Join 50,000+ creators" with small avatar stack

**Dashboard/Editor Preview**
- 3-column grid on desktop showing: timeline editor, preview panel, asset library
- Use subtle borders (border-white/10) to separate panels
- Floating toolbar with rounded-2xl pills
- Preview cards: aspect-video with overlay hover states

**Template Marketplace**
- Masonry grid (3-4 columns desktop, 2 tablet, 1 mobile)
- Cards: rounded-xl with video thumbnail, category tag, duration badge
- Hover: scale-105 transform with shadow elevation

**Analytics Dashboard**
- Card-based layout with rounded-xl containers
- Charts area: 2-column grid for metrics
- Stats cards: 4-column grid showing views, engagement, export count
- Use subtle gradients for chart backgrounds

**Collaboration Features**
- User avatar clusters with overlap (-space-x-2)
- Comment threads: speech bubble design with timestamps
- Real-time activity feed sidebar

**Footer**
- 4-column grid: Product, Resources, Company, Social
- Newsletter signup with inline form
- Social proof badges (G2, Trustpilot ratings)

### Icons
**Heroicons** (via CDN) for all UI elements - consistent stroke width, 24px base size

### Images Section

**Hero Image**: 
Cinematic shot of modern video editing interface on large display - dark themed workspace with colorful timeline, multiple video tracks, professional color grading panels. Should feel premium and aspirational. Place as full-width background with dark gradient overlay (from-black/80 to-black/40).

**Dashboard Screenshots**:
Interface mockups showing the actual editing workspace - 3 images total:
1. Main editor view with timeline
2. Template gallery interface
3. Analytics dashboard with graphs
Place in "Features" section as visual proof of capabilities.

**Template Previews**:
12-16 video thumbnail stills representing different template categories (social media, ads, tutorials, etc.). Use in marketplace grid section.

**Team/Collaboration**:
Modern team working together on video project - diverse creators in creative studio environment. Place in collaboration features section.

## Section Structure

1. **Hero** - Full viewport with image background, compelling headline, dual CTAs
2. **Social Proof Bar** - Logo strip of brands/platforms using the tool
3. **Features Grid** - 3 AI-powered tools with icon, title, description, and UI preview
4. **Editor Demo** - Large interactive-looking editor screenshot with callouts
5. **Template Marketplace Preview** - Grid showcase with "Browse 1000+ Templates" CTA
6. **Analytics Section** - Dashboard preview with key metrics highlighted
7. **Collaboration Features** - Split layout: features list + team image
8. **Integrations** - Platform logos grid (YouTube, TikTok, Instagram, etc.)
9. **Pricing** - 3-tier cards with feature comparison
10. **Final CTA** - Centered, high-impact "Start Creating Today" with trial offer
11. **Footer** - Comprehensive links + newsletter signup

**No animations** - Focus on solid visual hierarchy and polish.