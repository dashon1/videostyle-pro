import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project, StyleTemplate } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  styleTemplate?: StyleTemplate;
  onDownload?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onShare?: (project: Project) => void;
  onView?: (project: Project) => void;
  onStartProcessing?: (project: Project) => void;
}

export default function ProjectCard({ 
  project, 
  styleTemplate,
  onDownload,
  onEdit,
  onShare,
  onView,
  onStartProcessing
}: ProjectCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'fas fa-check';
      case 'processing': return 'fas fa-clock';
      case 'failed': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-clock';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-12 h-8 bg-muted rounded border border-border flex items-center justify-center flex-shrink-0">
              {project.thumbnailPath ? (
                <img 
                  src={project.thumbnailPath} 
                  alt="Project thumbnail" 
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <i className="fas fa-video text-muted-foreground text-sm"></i>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p 
                className="text-sm font-medium text-foreground truncate" 
                data-testid={`project-name-${project.id}`}
              >
                {project.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Created {new Date(project.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {styleTemplate && (
              <Badge 
                className={cn(
                  "text-xs",
                  styleTemplate.colorScheme === 'blue' && "bg-blue-100 text-blue-700",
                  styleTemplate.colorScheme === 'red' && "bg-red-100 text-red-700",
                  styleTemplate.colorScheme === 'purple' && "bg-purple-100 text-purple-700",
                  styleTemplate.colorScheme === 'green' && "bg-green-100 text-green-700"
                )}
                data-testid={`project-template-${project.id}`}
              >
                {styleTemplate.name}
              </Badge>
            )}
            
            <span 
              className="text-sm text-muted-foreground"
              data-testid={`project-duration-${project.id}`}
            >
              {formatDuration(project.duration)}
            </span>
            
            <Badge 
              className={cn("text-xs", getStatusColor(project.status || 'pending'))}
              data-testid={`project-status-${project.id}`}
            >
              <i className={`${getStatusIcon(project.status || 'pending')} mr-1`}></i>
              {project.status || 'pending'}
            </Badge>
            
            <div className="flex items-center space-x-2">
              {(project.status === 'pending' || project.status === 'uploaded') && onStartProcessing && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onStartProcessing(project)}
                  data-testid={`button-process-${project.id}`}
                >
                  <i className="fas fa-magic mr-1"></i>
                  Process Now
                </Button>
              )}
              {project.status === 'completed' && onView && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onView(project)}
                  data-testid={`button-view-results-${project.id}`}
                >
                  <i className="fas fa-chart-bar mr-1"></i>
                  View Results
                </Button>
              )}
              {project.status === 'completed' && onDownload && (
                <Button
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => onDownload(project)}
                  data-testid={`button-download-${project.id}`}
                >
                  <i className="fas fa-download mr-1"></i>
                  Download
                </Button>
              )}
              {onEdit && project.originalVideoPath && (
                <Button
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => onEdit(project)}
                  data-testid={`button-edit-${project.id}`}
                >
                  <i className="fas fa-edit mr-1"></i>
                  Edit
                </Button>
              )}
              {project.status === 'completed' && onShare && (
                <Button
                  size="sm" 
                  variant="ghost"
                  onClick={() => onShare(project)}
                  data-testid={`button-share-${project.id}`}
                >
                  <i className="fas fa-share"></i>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {project.status === 'processing' && project.progress !== undefined && (
          <div className="mt-3">
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
                data-testid={`project-progress-${project.id}`}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {project.progress}% complete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
