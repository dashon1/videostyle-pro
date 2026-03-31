import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, PlatformConnection, ScheduledPublish, PlatformFormat } from "@shared/schema";

const pathToTab: Record<string, string> = {
  "/publish/connections": "connections",
  "/publish/schedule": "schedule",
  "/publish/formats": "formats",
};

const platforms = [
  { id: "youtube", name: "YouTube", icon: "fab fa-youtube", color: "text-red-500" },
  { id: "tiktok", name: "TikTok", icon: "fab fa-tiktok", color: "text-black" },
  { id: "instagram", name: "Instagram", icon: "fab fa-instagram", color: "text-pink-500" },
  { id: "linkedin", name: "LinkedIn", icon: "fab fa-linkedin", color: "text-blue-600" },
  { id: "twitter", name: "Twitter/X", icon: "fab fa-twitter", color: "text-blue-400" },
];

export default function Publishing() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  
  const activeTab = pathToTab[location] || "connections";

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: connections } = useQuery<PlatformConnection[]>({
    queryKey: ["/api/platform-connections"],
  });

  const { data: scheduled } = useQuery<ScheduledPublish[]>({
    queryKey: ["/api/scheduled-publishes"],
  });

  const { data: formats } = useQuery<PlatformFormat[]>({
    queryKey: ["/api/projects", selectedProject, "formats"],
    enabled: !!selectedProject,
  });

  const connectPlatformMutation = useMutation({
    mutationFn: (platform: string) => 
      apiRequest("POST", "/api/platform-connections", {
        userId: "default",
        platform,
        channelName: `My ${platform} Channel`,
        isActive: true
      }),
    onSuccess: () => {
      toast({ title: "Platform connected!" });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-connections"] });
    },
  });

  const schedulePublishMutation = useMutation({
    mutationFn: (data: Partial<ScheduledPublish>) => 
      apiRequest("POST", "/api/scheduled-publishes", data),
    onSuccess: () => {
      toast({ title: "Video scheduled for publishing!" });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-publishes"] });
    },
  });

  const generateFormatsMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/generate-all-formats`),
    onSuccess: () => {
      toast({ title: "Generating all platform formats!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "formats"] });
    },
  });

  const publishNowMutation = useMutation({
    mutationFn: ({ projectId, platform }: { projectId: string; platform: string }) => 
      apiRequest("POST", `/api/projects/${projectId}/publish`, {
        platform,
        title: "My Video",
        description: "Check out my latest video!",
        visibility: "public"
      }),
    onSuccess: () => {
      toast({ title: "Video published!" });
    },
  });

  const completedProjects = projects?.filter(p => p.status === "completed");

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Publishing</h1>
        <p className="text-muted-foreground mt-2">
          Connect platforms, schedule posts, and export in multiple formats
        </p>
      </div>

      <Tabs 
        value={activeTab}
        onValueChange={(value) => {
          const tabToPath: Record<string, string> = {
            "connections": "/publish/connections",
            "schedule": "/publish/schedule",
            "formats": "/publish/formats",
          };
          setLocation(tabToPath[value] || "/publish/connections");
        }}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="connections" data-testid="tab-connections">Connections</TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger>
          <TabsTrigger value="formats" data-testid="tab-formats">Multi-Format</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-plug text-primary"></i>
                Platform Connections
              </CardTitle>
              <CardDescription>
                Connect your social media accounts for direct publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => {
                  const isConnected = connections?.some(c => c.platform === platform.id);
                  return (
                    <div 
                      key={platform.id}
                      className={`p-4 rounded-lg border ${
                        isConnected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`text-2xl ${platform.color}`}>
                          <i className={platform.icon}></i>
                        </div>
                        <div>
                          <h3 className="font-medium">{platform.name}</h3>
                          {isConnected && (
                            <p className="text-sm text-muted-foreground">Connected</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant={isConnected ? "outline" : "default"}
                        className="w-full"
                        onClick={() => !isConnected && connectPlatformMutation.mutate(platform.id)}
                        disabled={connectPlatformMutation.isPending}
                        data-testid={`button-connect-${platform.id}`}
                      >
                        {isConnected ? (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            Connected
                          </>
                        ) : (
                          <>
                            <i className="fas fa-link mr-2"></i>
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {connections && connections.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="font-medium">Connected Accounts</h4>
                  {connections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <i className={`fab fa-${conn.platform} text-xl`}></i>
                        <div>
                          <p className="font-medium">{conn.channelName}</p>
                          <p className="text-sm text-muted-foreground">
                            Connected {conn.connectedAt ? new Date(conn.connectedAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conn.isActive ? "default" : "secondary"}>
                          {conn.isActive ? "Active" : "Inactive"}
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

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-calendar-alt text-primary"></i>
                Schedule Posts
              </CardTitle>
              <CardDescription>
                Schedule processed videos for optimal posting times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Video</Label>
                    <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                      <SelectTrigger className="mt-1" data-testid="select-video-schedule">
                        <SelectValue placeholder="Choose a completed video" />
                      </SelectTrigger>
                      <SelectContent>
                        {completedProjects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Platform</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Title</Label>
                    <Input className="mt-1" placeholder="Video title" />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea className="mt-1" placeholder="Video description..." rows={4} />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <Input className="mt-1" placeholder="tag1, tag2, tag3" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Schedule Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1 justify-start">
                          <i className="fas fa-calendar mr-2"></i>
                          {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Visibility</Label>
                    <Select defaultValue="public">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full"
                      onClick={() => selectedProject && schedulePublishMutation.mutate({
                        projectId: selectedProject,
                        platformConnectionId: "demo",
                        platform: "youtube",
                        scheduledAt: scheduledDate || new Date(),
                        title: "My Video",
                        visibility: "public",
                        status: "scheduled"
                      })}
                      disabled={!selectedProject || schedulePublishMutation.isPending}
                      data-testid="button-schedule-publish"
                    >
                      <i className="fas fa-clock mr-2"></i>
                      Schedule Post
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => selectedProject && publishNowMutation.mutate({
                        projectId: selectedProject,
                        platform: "youtube"
                      })}
                      disabled={!selectedProject || publishNowMutation.isPending}
                      data-testid="button-publish-now"
                    >
                      <i className="fas fa-paper-plane mr-2"></i>
                      Publish Now
                    </Button>
                  </div>
                </div>
              </div>

              {scheduled && scheduled.length > 0 && (
                <div className="pt-6 border-t space-y-4">
                  <h4 className="font-medium">Scheduled Posts</h4>
                  {scheduled.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <i className={`fab fa-${post.platform} text-xl`}></i>
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {post.scheduledAt ? format(new Date(post.scheduledAt), "PPP 'at' p") : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        post.status === "published" ? "default" : 
                        post.status === "publishing" ? "secondary" : "outline"
                      }>
                        {post.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-expand-arrows-alt text-primary"></i>
                Multi-Format Export
              </CardTitle>
              <CardDescription>
                Auto-resize for different platforms (9:16 shorts, 16:9 long-form, 1:1 feed)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Select Video</Label>
                <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                  <SelectTrigger className="mt-1 max-w-md" data-testid="select-video-format">
                    <SelectValue placeholder="Choose a video" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && (
                <>
                  <Button 
                    onClick={() => generateFormatsMutation.mutate(selectedProject)}
                    disabled={generateFormatsMutation.isPending}
                    data-testid="button-generate-formats"
                  >
                    {generateFormatsMutation.isPending ? "Generating..." : "Generate All Formats"}
                  </Button>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { platform: "YouTube", ratio: "16:9", resolution: "1080p" },
                      { platform: "TikTok", ratio: "9:16", resolution: "1080p" },
                      { platform: "Instagram Reels", ratio: "9:16", resolution: "1080p" },
                      { platform: "Instagram Feed", ratio: "1:1", resolution: "1080p" },
                      { platform: "Twitter", ratio: "16:9", resolution: "720p" },
                      { platform: "LinkedIn", ratio: "16:9", resolution: "1080p" },
                    ].map((format, i) => {
                      const existingFormat = formats?.find(
                        f => f.platform === format.platform.toLowerCase().replace(" ", "-")
                      );
                      return (
                        <div key={i} className="p-4 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{format.platform}</h4>
                            {existingFormat && (
                              <Badge variant={existingFormat.status === "completed" ? "default" : "secondary"}>
                                {existingFormat.status}
                              </Badge>
                            )}
                          </div>
                          <div className={`bg-muted/50 rounded mb-3 flex items-center justify-center ${
                            format.ratio === "9:16" ? "aspect-[9/16] max-h-32" :
                            format.ratio === "1:1" ? "aspect-square max-h-32" :
                            "aspect-video"
                          }`}>
                            <span className="text-xs text-muted-foreground">{format.ratio}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{format.resolution}</p>
                          {existingFormat?.status === "completed" ? (
                            <Button variant="outline" size="sm" className="w-full">
                              <i className="fas fa-download mr-2"></i>
                              Download
                            </Button>
                          ) : existingFormat?.status === "pending" ? (
                            <Progress value={50} className="h-2" />
                          ) : (
                            <Button variant="outline" size="sm" className="w-full">
                              Generate
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
