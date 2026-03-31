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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Team, TeamMember, ProjectReview, ProjectComment, ProjectVersion } from "@shared/schema";

const pathToTab: Record<string, string> = {
  "/collab/teams": "teams",
  "/collab/review": "review",
  "/collab/versions": "versions",
};

export default function Collaboration() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  
  const activeTab = pathToTab[location] || "teams";

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: reviews } = useQuery<ProjectReview[]>({
    queryKey: ["/api/projects", selectedProject, "reviews"],
    enabled: !!selectedProject,
  });

  const { data: comments } = useQuery<ProjectComment[]>({
    queryKey: ["/api/projects", selectedProject, "comments"],
    enabled: !!selectedProject,
  });

  const { data: versions } = useQuery<ProjectVersion[]>({
    queryKey: ["/api/projects", selectedProject, "versions"],
    enabled: !!selectedProject,
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: Partial<Team>) => 
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      toast({ title: "Team created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: { projectId: string; status: string; feedback?: string }) => 
      apiRequest("POST", `/api/projects/${data.projectId}/reviews`, {
        reviewerId: "default",
        status: data.status,
        feedback: data.feedback
      }),
    onSuccess: () => {
      toast({ title: "Review submitted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "reviews"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { projectId: string; content: string }) => 
      apiRequest("POST", `/api/projects/${data.projectId}/comments`, {
        userId: "default",
        content: data.content
      }),
    onSuccess: () => {
      setNewComment("");
      toast({ title: "Comment added!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "comments"] });
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest("POST", `/api/projects/${projectId}/versions`, {
        changes: "Manual save point"
      }),
    onSuccess: () => {
      toast({ title: "Version saved!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "versions"] });
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Collaboration</h1>
        <p className="text-muted-foreground mt-2">
          Work together with your team on video projects
        </p>
      </div>

      <Tabs 
        value={activeTab}
        onValueChange={(value) => {
          const tabToPath: Record<string, string> = {
            "teams": "/collab/teams",
            "review": "/collab/review",
            "versions": "/collab/versions",
          };
          setLocation(tabToPath[value] || "/collab/teams");
        }}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-review">Review</TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-user-friends text-primary"></i>
                Team Workspaces
              </CardTitle>
              <CardDescription>
                Share templates and brand assets with editors/VAs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg border border-dashed border-border text-center">
                <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                <h4 className="font-medium mb-2">Create a Team</h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Invite editors, assistants, and clients to collaborate on your projects
                </p>
                <div className="flex gap-2 justify-center">
                  <Input placeholder="Team name..." className="max-w-xs" />
                  <Button 
                    onClick={() => createTeamMutation.mutate({
                      name: "My Team",
                      ownerId: "default",
                      plan: "pro"
                    })}
                    disabled={createTeamMutation.isPending}
                    data-testid="button-create-team"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create
                  </Button>
                </div>
              </div>

              {teams && teams.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Your Teams</h4>
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-medium">{team.name}</h5>
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        </div>
                        <Badge>{team.plan}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <Avatar key={i} className="w-8 h-8 border-2 border-background">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                              <AvatarFallback>U{i}</AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +2
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-user-plus mr-2"></i>
                          Invite
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <i className="fas fa-palette text-2xl text-primary mb-2"></i>
                      <h5 className="font-medium">Shared Templates</h5>
                      <p className="text-sm text-muted-foreground">12 templates</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <i className="fas fa-paint-brush text-2xl text-primary mb-2"></i>
                      <h5 className="font-medium">Brand Assets</h5>
                      <p className="text-sm text-muted-foreground">8 assets</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <i className="fas fa-folder text-2xl text-primary mb-2"></i>
                      <h5 className="font-medium">Team Projects</h5>
                      <p className="text-sm text-muted-foreground">24 projects</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary"></i>
                Review & Approval Workflow
              </CardTitle>
              <CardDescription>
                Get client/team feedback before final export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Select Project</Label>
                <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                  <SelectTrigger className="mt-1 max-w-md" data-testid="select-project-review">
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
              </div>

              {selectedProject && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <i className="fas fa-play-circle text-4xl text-muted-foreground"></i>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => createReviewMutation.mutate({
                          projectId: selectedProject,
                          status: "approved",
                          feedback: "Looks great!"
                        })}
                        disabled={createReviewMutation.isPending}
                        data-testid="button-approve"
                      >
                        <i className="fas fa-check mr-2"></i>
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => createReviewMutation.mutate({
                          projectId: selectedProject,
                          status: "changes_requested",
                          feedback: "Please make some changes"
                        })}
                        disabled={createReviewMutation.isPending}
                        data-testid="button-request-changes"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Request Changes
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Comments</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {comments?.map((comment) => (
                        <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">User</span>
                            {comment.timestamp && (
                              <Badge variant="outline" className="text-xs">
                                @{comment.timestamp.toFixed(1)}s
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                      {(!comments || comments.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No comments yet
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea 
                        placeholder="Add a comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button 
                        onClick={() => newComment && createCommentMutation.mutate({
                          projectId: selectedProject,
                          content: newComment
                        })}
                        disabled={!newComment || createCommentMutation.isPending}
                        data-testid="button-add-comment"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {reviews && reviews.length > 0 && (
                <div className="pt-6 border-t space-y-4">
                  <h4 className="font-medium">Review History</h4>
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>R</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">{review.feedback}</p>
                        <p className="text-xs text-muted-foreground">
                          {review.createdAt ? new Date(review.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                      <Badge variant={
                        review.status === "approved" ? "default" :
                        review.status === "changes_requested" ? "destructive" : "secondary"
                      }>
                        {review.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-history text-primary"></i>
                Version History
              </CardTitle>
              <CardDescription>
                Roll back to previous edits easily
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Select Project</Label>
                  <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                    <SelectTrigger className="mt-1" data-testid="select-project-versions">
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
                </div>
                {selectedProject && (
                  <Button 
                    onClick={() => createVersionMutation.mutate(selectedProject)}
                    disabled={createVersionMutation.isPending}
                    className="mt-6"
                    data-testid="button-save-version"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Save Version
                  </Button>
                )}
              </div>

              {selectedProject && (
                <div className="space-y-4">
                  <h4 className="font-medium">Version Timeline</h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {versions?.map((version, i) => (
                      <div key={version.id} className="relative">
                        <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
                        <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">v{version.versionNumber}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {version.createdAt ? new Date(version.createdAt).toLocaleString() : ""}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-restore-${version.id}`}>
                                <i className="fas fa-undo"></i>
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm">{version.changes}</p>
                        </div>
                      </div>
                    ))}
                    {(!versions || versions.length === 0) && (
                      <div className="relative">
                        <div className="absolute -left-6 w-4 h-4 rounded-full bg-muted border-4 border-background"></div>
                        <div className="p-4 rounded-lg border border-dashed border-border text-center">
                          <p className="text-sm text-muted-foreground">
                            No versions saved yet. Save your first version to start tracking changes.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
