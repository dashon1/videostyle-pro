import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Transcription, MusicTrack, MusicMatch, WatchFolder, BatchJob } from "@shared/schema";

const pathToTab: Record<string, string> = {
  "/automation/transcription": "transcription",
  "/automation/music": "music",
  "/automation/batch": "batch",
  "/automation/watch-folders": "watch",
};

export default function Automation() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const activeTab = pathToTab[location] || "transcription";

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: transcription } = useQuery<Transcription>({
    queryKey: ["/api/projects", selectedProject, "transcription"],
    enabled: !!selectedProject,
  });

  const { data: musicTracks } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music-tracks"],
  });

  const { data: musicMatches } = useQuery<MusicMatch[]>({
    queryKey: ["/api/projects", selectedProject, "music-matches"],
    enabled: !!selectedProject,
  });

  const { data: watchFolders } = useQuery<WatchFolder[]>({
    queryKey: ["/api/watch-folders"],
  });

  const { data: batchJobs } = useQuery<BatchJob[]>({
    queryKey: ["/api/batch-jobs"],
  });

  const generateTranscriptionMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/generate-transcription`),
    onSuccess: () => {
      toast({ title: "Transcription generated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "transcription"] });
    },
  });

  const matchMusicMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/match-music`),
    onSuccess: () => {
      toast({ title: "Music matched!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "music-matches"] });
    },
  });

  const createWatchFolderMutation = useMutation({
    mutationFn: (data: Partial<WatchFolder>) => 
      apiRequest("POST", "/api/watch-folders", data),
    onSuccess: () => {
      toast({ title: "Watch folder created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/watch-folders"] });
    },
  });

  const createBatchJobMutation = useMutation({
    mutationFn: (data: Partial<BatchJob>) => 
      apiRequest("POST", "/api/batch-jobs", data),
    onSuccess: () => {
      toast({ title: "Batch job started!" });
      queryClient.invalidateQueries({ queryKey: ["/api/batch-jobs"] });
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Automation</h1>
        <p className="text-muted-foreground mt-2">
          Automate repetitive tasks and process multiple videos at once
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
            <SelectTrigger data-testid="select-project">
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs 
        value={activeTab}
        onValueChange={(value) => {
          const tabToPath: Record<string, string> = {
            "transcription": "/automation/transcription",
            "music": "/automation/music",
            "batch": "/automation/batch",
            "watch": "/automation/watch-folders",
          };
          setLocation(tabToPath[value] || "/automation/transcription");
        }}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="transcription" data-testid="tab-transcription">Transcription</TabsTrigger>
          <TabsTrigger value="music" data-testid="tab-music">Music</TabsTrigger>
          <TabsTrigger value="batch" data-testid="tab-batch">Batch</TabsTrigger>
          <TabsTrigger value="watch" data-testid="tab-watch">Watch Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="transcription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-closed-captioning text-primary"></i>
                Auto-Transcription & Captions
              </CardTitle>
              <CardDescription>
                Generate accurate captions with your custom styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProject ? (
                <>
                  <Button 
                    onClick={() => generateTranscriptionMutation.mutate(selectedProject)}
                    disabled={generateTranscriptionMutation.isPending}
                    data-testid="button-generate-transcription"
                  >
                    {generateTranscriptionMutation.isPending ? "Generating..." : "Generate Transcription"}
                  </Button>

                  {transcription && (
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Transcription</h4>
                        <Badge>{transcription.language?.toUpperCase()}</Badge>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
                        {transcription.segments?.map((segment, i) => (
                          <div key={i} className="flex gap-4 py-2 border-b border-border last:border-0">
                            <span className="text-xs text-muted-foreground w-16">
                              {segment.start.toFixed(1)}s
                            </span>
                            <p className="flex-1 text-sm">{segment.text}</p>
                            {segment.speaker && (
                              <Badge variant="outline" className="text-xs">{segment.speaker}</Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Caption Style</Label>
                          <Select defaultValue="modern">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Select defaultValue="bottom">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1" data-testid="button-apply-captions">
                          <i className="fas fa-check mr-2"></i>
                          Apply Captions
                        </Button>
                        <Button variant="outline" data-testid="button-export-srt">
                          <i className="fas fa-download mr-2"></i>
                          Export SRT
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a project to generate transcription
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="music" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-music text-primary"></i>
                Music Mood Matching
              </CardTitle>
              <CardDescription>
                Auto-select royalty-free music that matches your video's energy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProject ? (
                <>
                  <Button 
                    onClick={() => matchMusicMutation.mutate(selectedProject)}
                    disabled={matchMusicMutation.isPending}
                    data-testid="button-match-music"
                  >
                    {matchMusicMutation.isPending ? "Analyzing..." : "Find Matching Music"}
                  </Button>

                  {musicMatches && musicMatches.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h4 className="font-medium">Recommended Tracks</h4>
                      {musicMatches.map((match) => {
                        const track = musicTracks?.find(t => t.id === match.trackId);
                        return (
                          <div key={match.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
                              <i className="fas fa-music text-primary"></i>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{track?.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{track?.artistName}</span>
                                <span>•</span>
                                <span>{track?.mood}</span>
                                <span>•</span>
                                <span>{track?.tempo} BPM</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                {Math.round((match.matchScore || 0) * 100)}% match
                              </p>
                              <Progress value={(match.matchScore || 0) * 100} className="w-20 h-2 mt-1" />
                            </div>
                            <Button 
                              variant={match.selected ? "default" : "outline"}
                              size="sm"
                              data-testid={`button-select-track-${match.id}`}
                            >
                              {match.selected ? "Selected" : "Select"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-4">Music Library</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {["upbeat", "calm", "dramatic", "corporate"].map((mood) => (
                        <Button key={mood} variant="outline" size="sm">
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a project to match music
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-layer-group text-primary"></i>
                Batch Processing
              </CardTitle>
              <CardDescription>
                Process multiple videos overnight with the same template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Select Videos</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {projects?.map((project) => (
                      <label key={project.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="flex-1">{project.name}</span>
                        <Badge variant="secondary">{project.status}</Badge>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Batch Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Apply Template</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corporate">Corporate Clean</SelectItem>
                          <SelectItem value="youtube">YouTube Format</SelectItem>
                          <SelectItem value="podcast">Podcast Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Output Format</Label>
                      <Select defaultValue="mp4">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp4">MP4</SelectItem>
                          <SelectItem value="mov">MOV</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable AI Auto-Cut</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Generate Captions</Label>
                      <Switch />
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => createBatchJobMutation.mutate({
                      userId: "default",
                      name: "Batch Job " + new Date().toLocaleDateString(),
                      projectIds: projects?.slice(0, 3).map(p => p.id) || []
                    })}
                    disabled={createBatchJobMutation.isPending}
                    data-testid="button-start-batch"
                  >
                    <i className="fas fa-play mr-2"></i>
                    Start Batch Processing
                  </Button>
                </div>
              </div>

              {batchJobs && batchJobs.length > 0 && (
                <div className="pt-6 border-t space-y-4">
                  <h4 className="font-medium">Active Batch Jobs</h4>
                  {batchJobs.map((job) => (
                    <div key={job.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{job.name}</span>
                        <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                      <Progress value={job.progress || 0} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {job.completedItems}/{job.totalItems} videos processed
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-folder-plus text-primary"></i>
                Watch Folders
              </CardTitle>
              <CardDescription>
                Auto-start processing when new files are dropped
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg border border-dashed border-border text-center">
                <i className="fas fa-folder-open text-4xl text-muted-foreground mb-4"></i>
                <h4 className="font-medium mb-2">Create Watch Folder</h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Set up a folder that automatically processes any video dropped into it
                </p>
                <div className="flex gap-2 justify-center">
                  <Input placeholder="Folder path..." className="max-w-xs" />
                  <Button 
                    onClick={() => createWatchFolderMutation.mutate({
                      userId: "default",
                      name: "My Watch Folder",
                      folderPath: "/videos/incoming",
                      autoProcess: true,
                      outputFormat: "mp4"
                    })}
                    disabled={createWatchFolderMutation.isPending}
                    data-testid="button-create-watch-folder"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create
                  </Button>
                </div>
              </div>

              {watchFolders && watchFolders.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Active Watch Folders</h4>
                  {watchFolders.map((folder) => (
                    <div key={folder.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                          <i className="fas fa-folder text-primary"></i>
                        </div>
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-sm text-muted-foreground">{folder.folderPath}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Auto-process</span>
                          <Switch checked={folder.autoProcess || false} />
                        </div>
                        <Badge variant={folder.isActive ? "default" : "secondary"}>
                          {folder.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-trash text-destructive"></i>
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
    </div>
  );
}
