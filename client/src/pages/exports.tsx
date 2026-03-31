import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Export, Project, InsertExport } from "@shared/schema";
import { insertExportSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Exports() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>();
  const [exportFormat, setExportFormat] = useState<string>("mp4");
  const [exportQuality, setExportQuality] = useState<string>("1080p");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: exports, isLoading: exportsLoading } = useQuery<Export[]>({
    queryKey: ["/api/exports"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createExportMutation = useMutation({
    mutationFn: async (data: InsertExport) => {
      return apiRequest("POST", "/api/exports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exports"] });
      setShowCreateDialog(false);
      setSelectedProject(undefined);
      setExportFormat("mp4");
      setExportQuality("1080p");
      toast({
        title: "Export started",
        description: "Your video export has been queued for processing.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to start export",
        description: "There was an error starting the export process.",
        variant: "destructive",
      });
    }
  });

  const handleCreateExport = () => {
    if (!selectedProject) {
      toast({
        title: "No project selected",
        description: "Please select a project to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const exportData: InsertExport = {
        projectId: selectedProject,
        format: exportFormat,
        quality: exportQuality,
        filePath: null,
        fileSize: null,
        status: "pending"
      };

      const validatedData = insertExportSchema.parse(exportData);
      createExportMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Invalid export settings",
        description: "Please check your export configuration.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (exportItem: Export) => {
    if (exportItem.filePath) {
      window.open(exportItem.filePath, '_blank');
    } else {
      toast({
        title: "File not ready",
        description: "The export is still processing.",
        variant: "destructive",
      });
    }
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
      case 'completed': return 'fas fa-check-circle';
      case 'processing': return 'fas fa-spinner fa-spin';
      case 'failed': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-clock';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const completedProjects = projects?.filter(p => p.status === 'completed') || [];
  const filteredExports = exports?.filter(exp => 
    statusFilter === "all" || exp.status === statusFilter
  ) || [];

  return (
    <>
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Exports</h2>
            <p className="text-muted-foreground">Manage video exports in different formats and qualities</p>
          </div>
          <div className="flex items-center space-x-4">
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
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-export">
                  <i className="fas fa-download mr-2"></i>
                  New Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Export</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-select">Select Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger data-testid="select-project">
                        <SelectValue placeholder="Choose a completed project" />
                      </SelectTrigger>
                      <SelectContent>
                        {completedProjects.length === 0 ? (
                          <SelectItem value="none" disabled>No completed projects available</SelectItem>
                        ) : (
                          completedProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="format-select">Format</Label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger data-testid="select-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp4">MP4</SelectItem>
                          <SelectItem value="mov">MOV</SelectItem>
                          <SelectItem value="avi">AVI</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quality-select">Quality</Label>
                      <Select value={exportQuality} onValueChange={setExportQuality}>
                        <SelectTrigger data-testid="select-quality">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p HD</SelectItem>
                          <SelectItem value="1080p">1080p Full HD</SelectItem>
                          <SelectItem value="1440p">1440p 2K</SelectItem>
                          <SelectItem value="4k">4K Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Export Settings</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Format: {exportFormat.toUpperCase()}</p>
                      <p>Quality: {exportQuality}</p>
                      <p>Estimated file size: {
                        exportQuality === '720p' ? '~200MB' :
                        exportQuality === '1080p' ? '~500MB' :
                        exportQuality === '1440p' ? '~800MB' : '~1.5GB'
                      }</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      data-testid="button-cancel-export"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateExport}
                      disabled={!selectedProject || createExportMutation.isPending}
                      data-testid="button-start-export"
                    >
                      {createExportMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-play mr-2"></i>
                      )}
                      Start Export
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Export Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Exports</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-total-exports">
                    {exports?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-download text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-completed-exports">
                    {exports?.filter(e => e.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-processing-exports">
                    {exports?.filter(e => e.status === 'processing').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-spinner text-yellow-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-total-size">
                    {formatFileSize(exports?.reduce((total, exp) => total + (exp.fileSize || 0), 0) || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-hdd text-purple-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exports List */}
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
          </CardHeader>
          <CardContent>
            {exportsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredExports.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-download text-6xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {statusFilter !== "all" ? "No exports with this status" : "No exports yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter !== "all" 
                    ? "Try changing the status filter to see more exports."
                    : "Create your first export from a completed project."
                  }
                </p>
                {statusFilter === "all" && completedProjects.length > 0 && (
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    data-testid="button-create-first-export"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Create First Export
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExports.map((exportItem) => {
                  const project = projects?.find(p => p.id === exportItem.projectId);
                  return (
                    <div 
                      key={exportItem.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center">
                          <i className="fas fa-file-video text-muted-foreground"></i>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p 
                              className="text-sm font-medium text-foreground truncate"
                              data-testid={`export-project-${exportItem.id}`}
                            >
                              {project?.name || 'Unknown Project'}
                            </p>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              data-testid={`export-format-${exportItem.id}`}
                            >
                              {exportItem.format.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              data-testid={`export-quality-${exportItem.id}`}
                            >
                              {exportItem.quality}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {exportItem.fileSize ? formatFileSize(exportItem.fileSize) : 'Size pending'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(exportItem.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={cn("text-xs", getStatusColor(exportItem.status || 'pending'))}
                          data-testid={`export-status-${exportItem.id}`}
                        >
                          <i className={`${getStatusIcon(exportItem.status || 'pending')} mr-1`}></i>
                          {exportItem.status || 'pending'}
                        </Badge>
                        
                        {exportItem.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(exportItem)}
                            data-testid={`button-download-export-${exportItem.id}`}
                          >
                            <i className="fas fa-download mr-2"></i>
                            Download
                          </Button>
                        )}
                        
                        {exportItem.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            data-testid={`button-processing-export-${exportItem.id}`}
                          >
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Processing
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
