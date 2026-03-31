import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalyticsEvent, Project } from "@shared/schema";

export default function Analytics() {
  const { data: events } = useQuery<AnalyticsEvent[]>({
    queryKey: ["/api/analytics/events"],
  });

  const { data: summary } = useQuery<{
    totalProjects: number;
    totalTimeSaved: number;
    videosProcessed: number;
    storageUsed: number;
  }>({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter(p => p.status === "completed") || [];
  const processingProjects = projects?.filter(p => p.status === "processing") || [];

  const timeSavedHours = Math.round((summary?.totalTimeSaved || 0) / 60);
  const storageUsedGB = ((summary?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your productivity and time saved with VideoStyle Pro
          </p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40" data-testid="select-time-range">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Videos Processed</p>
                <p className="text-3xl font-bold">{completedProjects.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <i className="fas fa-video text-blue-500 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-arrow-up text-green-500 mr-1"></i>
              <span className="text-green-500">12%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-3xl font-bold">{timeSavedHours}h</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <i className="fas fa-clock text-green-500 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-arrow-up text-green-500 mr-1"></i>
              <span className="text-green-500">24%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-3xl font-bold">{storageUsedGB} GB</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <i className="fas fa-database text-purple-500 text-xl"></i>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={parseFloat(storageUsedGB) / 100 * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">of 100 GB limit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold">{processingProjects.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <i className="fas fa-spinner text-orange-500 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground">{summary?.totalProjects || 0} total projects</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Saved Breakdown</CardTitle>
            <CardDescription>Hours saved by feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "AI Auto-Cut", hours: 45, percentage: 35 },
                { name: "Auto Transcription", hours: 28, percentage: 22 },
                { name: "Batch Processing", hours: 32, percentage: 25 },
                { name: "Music Matching", hours: 12, percentage: 9 },
                { name: "B-Roll Suggestions", hours: 11, percentage: 9 },
              ].map((feature, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <span className="text-sm text-muted-foreground">{feature.hours}h saved</span>
                  </div>
                  <Progress value={feature.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Activity</CardTitle>
            <CardDescription>Videos processed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {[40, 55, 35, 70, 45, 60, 80, 65, 75, 90, 85, 95].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary/80 rounded-t"
                    style={{ height: `${value}%` }}
                  ></div>
                  <span className="text-xs text-muted-foreground">
                    {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events?.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  event.eventType === "project_created" ? "bg-blue-500/10 text-blue-500" :
                  event.eventType === "processing_completed" ? "bg-green-500/10 text-green-500" :
                  event.eventType === "export_started" ? "bg-purple-500/10 text-purple-500" :
                  "bg-gray-500/10 text-gray-500"
                }`}>
                  <i className={`fas ${
                    event.eventType === "project_created" ? "fa-plus" :
                    event.eventType === "processing_completed" ? "fa-check" :
                    event.eventType === "export_started" ? "fa-download" :
                    "fa-clock"
                  }`}></i>
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {event.eventType === "project_created" ? "Project Created" :
                     event.eventType === "processing_completed" ? "Processing Completed" :
                     event.eventType === "export_started" ? "Export Started" :
                     event.eventType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                {event.timeSavedMinutes && event.timeSavedMinutes > 0 && (
                  <Badge variant="secondary">
                    <i className="fas fa-clock mr-1"></i>
                    {Math.round(event.timeSavedMinutes / 60)}h saved
                  </Badge>
                )}
              </div>
            ))}
            {(!events || events.length === 0) && (
              <div className="text-center py-8">
                <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No activity recorded yet</p>
                <p className="text-sm text-muted-foreground">Start processing videos to see your analytics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Used Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "YouTube Format", uses: 45, icon: "fas fa-play" },
                { name: "TikTok Viral", uses: 38, icon: "fas fa-bolt" },
                { name: "Corporate Clean", uses: 22, icon: "fas fa-building" },
              ].map((template, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <i className={`${template.icon} text-primary text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.uses} uses</p>
                  </div>
                  <Badge variant="outline">#{i + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { format: "MP4 1080p", count: 67, percentage: 55 },
                { format: "MP4 4K", count: 28, percentage: 23 },
                { format: "9:16 Vertical", count: 18, percentage: 15 },
                { format: "1:1 Square", count: 9, percentage: 7 },
              ].map((format, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{format.format}</span>
                    <span className="text-sm text-muted-foreground">{format.count} exports</span>
                  </div>
                  <Progress value={format.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
