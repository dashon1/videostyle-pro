import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface NavItem {
  name: string;
  href?: string;
  icon: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
  { name: "Upload Videos", href: "/upload", icon: "fas fa-cloud-upload-alt" },
  { name: "Projects", href: "/projects", icon: "fas fa-folder-open" },
  {
    name: "AI Features",
    icon: "fas fa-brain",
    children: [
      { name: "Auto-Cut Detection", href: "/ai/auto-cut", icon: "fas fa-cut" },
      { name: "Scene Detection", href: "/ai/scenes", icon: "fas fa-film" },
      { name: "B-Roll Suggestions", href: "/ai/b-roll", icon: "fas fa-images" },
      { name: "Voice Clone", href: "/ai/voice-clone", icon: "fas fa-microphone-alt" },
      { name: "AI Thumbnails", href: "/ai/thumbnails", icon: "fas fa-image" },
    ],
  },
  {
    name: "Style Learning",
    icon: "fas fa-magic",
    children: [
      { name: "Style Engine", href: "/style/engine", icon: "fas fa-sliders-h" },
      { name: "Personality Presets", href: "/style/presets", icon: "fas fa-user-astronaut" },
      { name: "Brand Voice", href: "/style/brand-voice", icon: "fas fa-bullhorn" },
    ],
  },
  {
    name: "Automation",
    icon: "fas fa-robot",
    children: [
      { name: "Transcription & Captions", href: "/automation/transcription", icon: "fas fa-closed-captioning" },
      { name: "Music Matching", href: "/automation/music", icon: "fas fa-music" },
      { name: "Batch Processing", href: "/automation/batch", icon: "fas fa-layer-group" },
      { name: "Watch Folders", href: "/automation/watch-folders", icon: "fas fa-folder-plus" },
    ],
  },
  {
    name: "Publishing",
    icon: "fas fa-share-alt",
    children: [
      { name: "Platform Connections", href: "/publish/connections", icon: "fas fa-plug" },
      { name: "Schedule Posts", href: "/publish/schedule", icon: "fas fa-calendar-alt" },
      { name: "Multi-Format Export", href: "/publish/formats", icon: "fas fa-expand-arrows-alt" },
    ],
  },
  {
    name: "Collaboration",
    icon: "fas fa-users",
    children: [
      { name: "Team Workspaces", href: "/collab/teams", icon: "fas fa-user-friends" },
      { name: "Review & Approval", href: "/collab/review", icon: "fas fa-check-circle" },
      { name: "Version History", href: "/collab/versions", icon: "fas fa-history" },
    ],
  },
  { name: "Style Templates", href: "/templates", icon: "fas fa-palette" },
  { name: "Marketplace", href: "/marketplace", icon: "fas fa-store" },
  { name: "Brand Assets", href: "/brand-assets", icon: "fas fa-paint-brush" },
  { name: "Analytics", href: "/analytics", icon: "fas fa-chart-line" },
  { name: "Exports", href: "/exports", icon: "fas fa-download" },
];

interface NavGroupProps {
  item: NavItem;
  location: string;
}

function NavGroup({ item, location }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(
    item.children?.some(child => location === child.href) || false
  );

  if (item.children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid={`nav-group-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center space-x-3">
            <i className={`${item.icon} w-4`}></i>
            <span>{item.name}</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {isOpen && (
          <div className="ml-4 pl-3 border-l border-border space-y-1">
            {item.children.map((child) => (
              <NavLink key={child.name} item={child} location={location} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <NavLink item={item} location={location} />;
}

function NavLink({ item, location }: { item: NavItem; location: string }) {
  if (!item.href) return null;
  
  const isActive = location === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <i className={`${item.icon} w-4`}></i>
      <span>{item.name}</span>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <i className="fas fa-video text-primary-foreground text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-foreground">VideoStyle Pro</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavGroup key={item.name} item={item} location={location} />
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40" 
            alt="User avatar" 
            className="w-8 h-8 rounded-full object-cover"
            data-testid="user-avatar"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">Alex Johnson</p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-plan">Pro Plan</p>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-settings"
          >
            <i className="fas fa-cog text-sm"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
