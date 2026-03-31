import { useState } from "react";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  src?: string;
  thumbnailSrc?: string;
  title?: string;
  className?: string;
}

export default function VideoPreview({ src, thumbnailSrc, title, className }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!src && !thumbnailSrc) {
    return (
      <div className={cn(
        "aspect-video bg-muted rounded-lg border border-border flex items-center justify-center",
        className
      )}>
        <div className="text-center">
          <i className="fas fa-video text-4xl text-muted-foreground mb-2"></i>
          <p className="text-sm text-muted-foreground">No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {!isPlaying && thumbnailSrc ? (
        <div className="relative">
          <img 
            src={thumbnailSrc} 
            alt={title || "Video thumbnail"} 
            className="w-full aspect-video object-cover rounded-lg border border-border"
          />
          <button 
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="button-play-video"
          >
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <i className="fas fa-play text-black ml-1"></i>
            </div>
          </button>
        </div>
      ) : src ? (
        <video 
          src={src} 
          controls 
          className="w-full aspect-video rounded-lg border border-border"
          data-testid="video-player"
        />
      ) : (
        <div className="w-full aspect-video bg-muted rounded-lg border border-border flex items-center justify-center">
          <i className="fas fa-video text-2xl text-muted-foreground"></i>
        </div>
      )}
    </div>
  );
}
