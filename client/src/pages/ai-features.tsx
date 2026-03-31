import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, AiAnalysisResult, GeneratedThumbnail, VoiceClone } from "@shared/schema";

const pathToTab: Record<string, string> = {
  "/ai/auto-cut": "auto-cut",
  "/ai/scenes": "scenes",
  "/ai/b-roll": "b-roll",
  "/ai/voice-clone": "voice",
  "/ai/thumbnails": "thumbnails",
};

export default function AIFeatures() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const activeTab = pathToTab[location] || "auto-cut";

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: aiResults } = useQuery<AiAnalysisResult[]>({
    queryKey: ["/api/projects", selectedProject, "ai-analysis"],
    enabled: !!selectedProject,
  });

  const { data: thumbnails } = useQuery<GeneratedThumbnail[]>({
    queryKey: ["/api/projects", selectedProject, "thumbnails"],
    enabled: !!selectedProject,
  });

  const { data: voiceClones } = useQuery<VoiceClone[]>({
    queryKey: ["/api/voice-clones"],
  });

  const autoCutMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/analyze/auto-cut`),
    onSuccess: () => {
      toast({ title: "Auto-cut analysis complete!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "ai-analysis"] });
    },
  });

  const sceneDetectionMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/analyze/scenes`),
    onSuccess: () => {
      toast({ title: "Scene detection complete!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "ai-analysis"] });
    },
  });

  const bRollMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/generate-b-roll`),
    onSuccess: () => {
      toast({ title: "B-Roll suggestions ready!" });
    },
  });

  const thumbnailMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/generate-thumbnails`),
    onSuccess: () => {
      toast({ title: "Thumbnails generated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "thumbnails"] });
    },
  });

  const autoCutResult = aiResults?.find(r => r.analysisType === "auto-cut");
  const sceneResult = aiResults?.find(r => r.analysisType === "scene-detection");

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Features</h1>
        <p className="text-muted-foreground mt-2">
          Powerful AI tools to automate your video editing workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to apply AI features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects?.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedProject === project.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid={`project-select-${project.id}`}
              >
                <h3 className="font-medium text-foreground">{project.name}</h3>
                <Badge variant={project.status === "completed" ? "default" : "secondary"} className="mt-2">
                  {project.status}
                </Badge>
              </button>
            ))}
            {projects?.length === 0 && (
              <p className="text-muted-foreground col-span-3 text-center py-8">
                No projects found. Upload a video first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedProject && (
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            const tabToPath: Record<string, string> = {
              "auto-cut": "/ai/auto-cut",
              "scenes": "/ai/scenes",
              "b-roll": "/ai/b-roll",
              "voice": "/ai/voice-clone",
              "thumbnails": "/ai/thumbnails",
            };
            setLocation(tabToPath[value] || "/ai/auto-cut");
          }}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="auto-cut" data-testid="tab-auto-cut">Auto-Cut</TabsTrigger>
            <TabsTrigger value="scenes" data-testid="tab-scenes">Scenes</TabsTrigger>
            <TabsTrigger value="b-roll" data-testid="tab-b-roll">B-Roll</TabsTrigger>
            <TabsTrigger value="voice" data-testid="tab-voice">Voice Clone</TabsTrigger>
            <TabsTrigger value="thumbnails" data-testid="tab-thumbnails">Thumbnails</TabsTrigger>
          </TabsList>

          <TabsContent value="auto-cut" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-cut text-primary"></i>
                  AI Auto-Cut Detection
                </CardTitle>
                <CardDescription>
                  Automatically detect and remove filler words, awkward pauses, and "ums/ahs"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => autoCutMutation.mutate(selectedProject)}
                  disabled={autoCutMutation.isPending}
                  data-testid="button-analyze-auto-cut"
                >
                  {autoCutMutation.isPending ? "Analyzing..." : "Run Auto-Cut Analysis"}
                </Button>

                {autoCutResult && autoCutResult.results?.segments && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Analysis Results</h4>
                      <Badge>Confidence: {Math.round((autoCutResult.confidence || 0) * 100)}%</Badge>
                    </div>
                    <div className="space-y-2">
                      {autoCutResult.results.segments.map((segment, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                          <Badge variant={segment.type === "keep" ? "default" : "destructive"}>
                            {segment.type}
                          </Badge>
                          <span className="text-sm">
                            {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                          </span>
                          <Progress value={segment.confidence * 100} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(segment.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full" data-testid="button-apply-auto-cut">
                      <i className="fas fa-check mr-2"></i>
                      Apply Auto-Cuts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-film text-primary"></i>
                  AI Scene Detection
                </CardTitle>
                <CardDescription>
                  Intelligently identify topic changes and suggest chapter markers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => sceneDetectionMutation.mutate(selectedProject)}
                  disabled={sceneDetectionMutation.isPending}
                  data-testid="button-detect-scenes"
                >
                  {sceneDetectionMutation.isPending ? "Detecting..." : "Detect Scenes"}
                </Button>

                {sceneResult && sceneResult.results?.scenes && (
                  <div className="space-y-4 mt-6">
                    <h4 className="font-medium">Detected Scenes</h4>
                    <div className="space-y-2">
                      {sceneResult.results.scenes.map((scene, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{scene.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {Math.floor(scene.start / 60)}:{(scene.start % 60).toString().padStart(2, "0")} - 
                              {Math.floor(scene.end / 60)}:{(scene.end % 60).toString().padStart(2, "0")}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-edit"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full" data-testid="button-add-chapters">
                      <i className="fas fa-bookmark mr-2"></i>
                      Add as Chapter Markers
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="b-roll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-images text-primary"></i>
                  AI B-Roll Suggestions
                </CardTitle>
                <CardDescription>
                  Get relevant stock footage recommendations based on your video content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => bRollMutation.mutate(selectedProject)}
                  disabled={bRollMutation.isPending}
                  data-testid="button-suggest-broll"
                >
                  {bRollMutation.isPending ? "Analyzing..." : "Get B-Roll Suggestions"}
                </Button>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>At 0:15</Badge>
                      <span className="text-sm text-muted-foreground">Technology</span>
                    </div>
                    <div className="aspect-video bg-gray-800 rounded-md flex items-center justify-center">
                      <i className="fas fa-play-circle text-4xl text-gray-600"></i>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" data-testid="button-use-broll">Use</Button>
                      <Button size="sm" variant="outline">Skip</Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>At 0:45</Badge>
                      <span className="text-sm text-muted-foreground">Business</span>
                    </div>
                    <div className="aspect-video bg-gray-800 rounded-md flex items-center justify-center">
                      <i className="fas fa-play-circle text-4xl text-gray-600"></i>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">Use</Button>
                      <Button size="sm" variant="outline">Skip</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-microphone-alt text-primary"></i>
                  Voice Clone for Pickups
                </CardTitle>
                <CardDescription>
                  Re-record small audio fixes using your cloned voice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border border-dashed border-border text-center">
                  <i className="fas fa-microphone text-4xl text-muted-foreground mb-4"></i>
                  <h4 className="font-medium mb-2">Create Voice Clone</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload 3-5 audio samples to train your voice model
                  </p>
                  <Button data-testid="button-create-voice-clone">
                    <i className="fas fa-plus mr-2"></i>
                    Upload Audio Samples
                  </Button>
                </div>

                {voiceClones && voiceClones.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Your Voice Clones</h4>
                    {voiceClones.map((clone) => (
                      <div key={clone.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <i className="fas fa-user text-primary"></i>
                          </div>
                          <div>
                            <p className="font-medium">{clone.name}</p>
                            <Badge variant={clone.status === "ready" ? "default" : "secondary"}>
                              {clone.status}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" disabled={clone.status !== "ready"}>
                          Use for Pickup
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="thumbnails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-image text-primary"></i>
                  AI Thumbnail Generator
                </CardTitle>
                <CardDescription>
                  Create click-worthy thumbnails from video highlights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => thumbnailMutation.mutate(selectedProject)}
                  disabled={thumbnailMutation.isPending}
                  data-testid="button-generate-thumbnails"
                >
                  {thumbnailMutation.isPending ? "Generating..." : "Generate Thumbnails"}
                </Button>

                {thumbnails && thumbnails.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {thumbnails.map((thumb) => (
                      <div 
                        key={thumb.id} 
                        className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                          thumb.selected ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{thumb.elements?.text}</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/50">
                            {Math.round((thumb.score || 0) * 100)}% match
                          </Badge>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80">
                          <Button 
                            size="sm" 
                            className="w-full"
                            variant={thumb.selected ? "default" : "secondary"}
                            data-testid={`button-select-thumbnail-${thumb.id}`}
                          >
                            {thumb.selected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
