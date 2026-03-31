import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectCard from "@/components/ProjectCard";
import type { Project, StyleTemplate } from "@shared/schema";

export default function Projects() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    refetchInterval: (query) => {
      const data = query.state.data as Project[] | undefined;
      const hasProcessing = data?.some(p => p.status === 'processing');
      return hasProcessing ? 2000 : false;
    },
  });

  const { data: templates } = useQuery<StyleTemplate[]>({
    queryKey: ["/api/style-templates"],
  });

  const startProcessingMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("POST", `/api/projects/${projectId}/start-processing`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processing-jobs/active"] });
      toast({
        title: "Processing started",
        description: "AI is now analyzing your video. This may take a few minutes.",
      });
    },
    onError: () => {
      toast({
        title: "Processing failed",
        description: "There was an error starting video processing.",
        variant: "destructive",
      });
    }
  });

  const handleStartProcessing = (project: Project) => {
    startProcessingMutation.mutate(project.id);
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete project",
        description: "There was an error deleting the project.",
        variant: "destructive",
      });
    }
  });

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDownload = (project: Project) => {
    if (project.originalVideoPath || project.processedVideoPath) {
      window.open(`/api/projects/${project.id}/video`, '_blank');
    } else {
      toast({
        title: "Video not ready",
        description: "The processed video is not available yet.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setLocation(`/editor/${project.id}`);
  };

  const handleShare = (project: Project) => {
    if (project.processedVideoPath) {
      navigator.clipboard.writeText(window.location.origin + project.processedVideoPath);
      toast({
        title: "Link copied",
        description: "The video link has been copied to your clipboard.",
      });
    }
  };

  const handleView = (project: Project) => {
    setLocation(`/projects/${project.id}`);
  };

  const handleDeleteProject = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border p-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground">View and manage all your video projects</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-projects"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <i className="fas fa-folder-open text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm || statusFilter !== "all" ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Upload your first video to create a project."
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button data-testid="button-upload-first-video">
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  Upload Your First Video
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const template = templates?.find(t => t.id === project.styleTemplateId);
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  styleTemplate={template}
                  onDownload={handleDownload}
                  onEdit={handleEdit}
                  onShare={handleShare}
                  onView={handleView}
                  onStartProcessing={handleStartProcessing}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
