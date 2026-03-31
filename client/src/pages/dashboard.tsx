import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StatsCard from "@/components/StatsCard";
import ProcessingQueue from "@/components/ProcessingQueue";
import ProjectCard from "@/components/ProjectCard";
import TemplateCard from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Project, StyleTemplate, BrandAsset } from "@shared/schema";

interface DashboardStats {
  videosProcessed: number;
  timeSaved: string;
  activeTemplates: number;
  storageUsed: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
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

  const { data: brandAssets } = useQuery<BrandAsset[]>({
    queryKey: ["/api/brand-assets"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; originalVideoPath: string; styleTemplateId?: string }) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processing-jobs"] });
      toast({
        title: "Video uploaded successfully",
        description: "Click 'Process Now' to start AI-powered editing.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video.",
        variant: "destructive",
      });
    }
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

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: { successful: { uploadURL: string; name: string }[] }) => {
    const uploadedFile = result.successful?.[0];
    if (uploadedFile && uploadedFile.uploadURL) {
      const videoPath = uploadedFile.uploadURL;
      const fileName = uploadedFile.name?.replace(/\.[^/.]+$/, "") || "New Video";
      
      createProjectMutation.mutate({
        name: fileName,
        originalVideoPath: videoPath,
        styleTemplateId: templates?.[0]?.id || undefined,
      });
    }
  };

  const recentProjects = projects?.slice(0, 3) || [];
  const popularTemplates = templates?.slice(0, 3) || [];

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">Manage your video projects and automation</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button data-testid="button-new-project">
              <i className="fas fa-plus mr-2"></i>
              New Project
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" data-testid="button-notifications">
                <i className="fas fa-bell"></i>
              </Button>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome / Getting Started Section */}
      {(!projects || projects.length === 0) && (
        <div className="mx-6 mt-6">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Welcome to VideoStyle Pro!</h3>
                  <p className="text-blue-100 mb-4 max-w-2xl">
                    Turn hours of video editing into minutes. Our AI automatically analyzes your videos to find and remove filler words, detect scene changes, suggest background music, and more.
                  </p>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                      <i className="fas fa-magic"></i>
                      <span className="text-sm">AI Auto-Editing</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                      <i className="fas fa-cut"></i>
                      <span className="text-sm">Remove Filler Words</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                      <i className="fas fa-film"></i>
                      <span className="text-sm">Scene Detection</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                      <i className="fas fa-music"></i>
                      <span className="text-sm">Music Matching</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 inline-block">
                    <p className="font-semibold mb-1">How to get started:</p>
                    <ol className="text-sm text-blue-100 space-y-1">
                      <li>1. Upload a video below (drag & drop or click to browse)</li>
                      <li>2. Click the green "Process Now" button on your video</li>
                      <li>3. Wait for AI to analyze and edit your video</li>
                      <li>4. Download or share your polished video!</li>
                    </ol>
                  </div>
                </div>
                <div className="hidden lg:block ml-6">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-video text-5xl"></i>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt for pending projects */}
      {projects && projects.some(p => p.status === 'pending' || p.status === 'uploaded') && (
        <div className="mx-6 mt-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-lightbulb text-amber-600"></i>
                </div>
                <div>
                  <p className="font-medium text-amber-900">You have videos ready to process!</p>
                  <p className="text-sm text-amber-700">Click the green "Process Now" button on any video to start AI-powered editing.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Videos Processed"
            value={stats?.videosProcessed?.toString() || "0"}
            icon="fas fa-check-circle"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            change="12% from last month"
            changeIcon="fas fa-arrow-up"
            changeColor="text-green-600"
          />
          <StatsCard
            title="Time Saved"
            value={stats?.timeSaved || "0h"}
            icon="fas fa-clock"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            change="Average 5h per video"
            changeIcon="fas fa-arrow-up"
            changeColor="text-blue-600"
          />
          <StatsCard
            title="Active Templates"
            value={stats?.activeTemplates?.toString() || "0"}
            icon="fas fa-palette"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            change="3 new this week"
            changeIcon="fas fa-plus"
            changeColor="text-purple-600"
          />
          <StatsCard
            title="Storage Used"
            value={stats?.storageUsed || "0GB"}
            icon="fas fa-hdd"
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            change="of 5TB available"
            changeColor="text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Upload New Video</h3>
                
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-cloud-upload-alt text-2xl text-muted-foreground"></i>
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Drop your video files here</h4>
                    <p className="text-muted-foreground mb-4">Supports MP4, MOV, AVI up to 2GB</p>
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                      Choose Files
                    </span>
                  </div>
                </ObjectUploader>
                
                {projectsLoading ? (
                  <div className="mt-4 space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-md"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {recentProjects.map((project) => {
                      const template = templates?.find(t => t.id === project.styleTemplateId);
                      return (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          styleTemplate={template}
                          onView={() => setLocation(`/projects/${project.id}`)}
                          onStartProcessing={handleStartProcessing}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Processing Queue */}
          <ProcessingQueue />
        </div>

        {/* Recent Projects */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Recent Projects</h3>
              <Button variant="ghost" data-testid="button-view-all-projects">
                View All
              </Button>
            </div>
            
            {projectsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-20 bg-muted rounded"></div>
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-folder-open text-4xl text-muted-foreground mb-2"></i>
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground">Upload your first video to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => {
                  const template = templates?.find(t => t.id === project.styleTemplateId);
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      styleTemplate={template}
                      onDownload={() => project.processedVideoPath && window.open(project.processedVideoPath, '_blank')}
                      onEdit={() => setLocation(`/projects/${project.id}`)}
                      onShare={() => {
                        if (project.processedVideoPath) {
                          navigator.clipboard.writeText(window.location.origin + project.processedVideoPath);
                          toast({ title: "Link copied" });
                        }
                      }}
                      onView={() => setLocation(`/projects/${project.id}`)}
                      onStartProcessing={handleStartProcessing}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Style Templates & Brand Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Popular Style Templates</h3>
                <Button variant="ghost" data-testid="button-manage-templates">
                  Manage Templates
                </Button>
              </div>
              
              <div className="space-y-3">
                {popularTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => console.log("Edit template:", template.id)}
                  />
                ))}
              </div>
              
              <Button variant="secondary" className="w-full mt-4" data-testid="button-create-template">
                <i className="fas fa-plus mr-2"></i>
                Create New Template
              </Button>
            </CardContent>
          </Card>

          {/* Brand Assets */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Brand Assets</h3>
                <Button variant="ghost" data-testid="button-upload-assets">
                  Upload Assets
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Logos & Intros</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {brandAssets?.filter(asset => asset.type === 'logo').slice(0, 2).map((asset) => (
                      <div key={asset.id} className="aspect-square bg-muted rounded-md border border-border flex items-center justify-center">
                        {asset.filePath ? (
                          <img src={asset.filePath} alt={asset.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <i className="fas fa-image text-muted-foreground"></i>
                        )}
                      </div>
                    ))}
                    <div className="aspect-square bg-muted rounded-md border-2 border-dashed border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer">
                      <i className="fas fa-plus text-muted-foreground"></i>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Color Schemes</h4>
                  <div className="space-y-2">
                    {brandAssets?.filter(asset => asset.type === 'colorScheme').map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-2 border border-border rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {asset.metadata?.colors?.map((color, idx) => (
                              <div 
                                key={idx} 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: color }}
                              ></div>
                            ))}
                          </div>
                          <span className="text-sm text-foreground">{asset.name}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <i className="fas fa-edit text-xs"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Fonts</h4>
                  <div className="space-y-2">
                    {brandAssets?.filter(asset => asset.type === 'font').map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-2 border border-border rounded-md">
                        <span 
                          className="text-sm text-foreground"
                          style={{ 
                            fontFamily: asset.metadata?.fontFamily,
                            fontWeight: asset.metadata?.fontWeight
                          }}
                        >
                          {asset.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {asset.metadata?.fontWeight === '700' ? 'Headings' : 'Body'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
