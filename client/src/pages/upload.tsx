import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { StyleTemplate } from "@shared/schema";

export default function Upload() {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string>();

  const { data: templates } = useQuery<StyleTemplate[]>({
    queryKey: ["/api/style-templates"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string;
      originalVideoPath: string; 
      styleTemplateId?: string;
    }) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processing-jobs"] });
      toast({
        title: "Project created successfully",
        description: "Your video has been added to the processing queue.",
      });
      // Reset form
      setProjectName("");
      setProjectDescription("");
      setSelectedTemplate(undefined);
      setUploadedVideoPath(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to create project",
        description: "There was an error creating your project.",
        variant: "destructive",
      });
    }
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: { successful: Array<{ uploadURL: string; name: string }> }) => {
    const uploadedFile = result.successful?.[0];
    if (uploadedFile) {
      setUploadedVideoPath(uploadedFile.uploadURL);
      if (!projectName) {
        setProjectName(uploadedFile.name?.replace(/\.[^/.]+$/, "") || "New Project");
      }
      toast({
        title: "Video uploaded successfully",
        description: "Configure your project settings below.",
      });
    }
  };

  const handleCreateProject = () => {
    if (!uploadedVideoPath) {
      toast({
        title: "No video uploaded",
        description: "Please upload a video first.",
        variant: "destructive",
      });
      return;
    }

    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a project name.",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
      originalVideoPath: uploadedVideoPath,
      styleTemplateId: selectedTemplate,
    });
  };

  return (
    <>
      <header className="bg-card border-b border-border p-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Upload Videos</h2>
          <p className="text-muted-foreground">Upload and configure new video projects</p>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent>
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

            {uploadedVideoPath && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <div>
                    <p className="text-sm font-medium text-foreground">Video uploaded successfully</p>
                    <p className="text-xs text-muted-foreground">Configure your project settings below</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Configuration */}
        {uploadedVideoPath && (
          <Card>
            <CardHeader>
              <CardTitle>Project Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  data-testid="input-project-name"
                />
              </div>

              <div>
                <Label htmlFor="project-description">Description (Optional)</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of your project"
                  data-testid="input-project-description"
                />
              </div>

              <div>
                <Label htmlFor="style-template">Style Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger data-testid="select-style-template">
                    <SelectValue placeholder="Choose a style template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template (manual editing)</SelectItem>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center space-x-2">
                          <i className={template.icon || "fas fa-palette"}></i>
                          <span>{template.name}</span>
                          <span className="text-muted-foreground">({template.usageCount} uses)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setProjectName("");
                    setProjectDescription("");
                    setSelectedTemplate(undefined);
                    setUploadedVideoPath(undefined);
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!uploadedVideoPath || !projectName.trim() || createProjectMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createProjectMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-play mr-2"></i>
                  )}
                  Start Processing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
