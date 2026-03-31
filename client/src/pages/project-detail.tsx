import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface AiAnalysisResult {
  id: string;
  projectId: string;
  analysisType: string;
  results: any;
  confidence: number;
  status: string;
}

interface Transcription {
  id: string;
  projectId: string;
  text: string;
  segments: { start: number; end: number; text: string; confidence: number }[];
}

interface BRollSuggestion {
  id: string;
  projectId: string;
  keyword: string;
  timestamp: number;
  suggestions: { url: string; source: string; relevance: number }[];
}

interface MusicMatch {
  id: string;
  projectId: string;
  trackId: string;
  matchScore: number;
  energyAlignment: number;
  selected: boolean;
}

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  const { data: aiResults } = useQuery<AiAnalysisResult[]>({
    queryKey: [`/api/projects/${projectId}/ai-analysis`],
    enabled: !!projectId,
  });

  const { data: transcriptions } = useQuery<Transcription[]>({
    queryKey: [`/api/projects/${projectId}/transcriptions`],
    enabled: !!projectId,
  });

  const { data: brollSuggestions } = useQuery<BRollSuggestion[]>({
    queryKey: [`/api/projects/${projectId}/b-roll`],
    enabled: !!projectId,
  });

  const { data: musicMatches } = useQuery<MusicMatch[]>({
    queryKey: [`/api/projects/${projectId}/music-matches`],
    enabled: !!projectId,
  });

  const handleDownload = () => {
    if (projectId) {
      window.open(`/api/projects/${projectId}/video`, '_blank');
      toast({
        title: "Download started",
        description: "Your video is downloading.",
      });
    } else {
      toast({
        title: "Video not available",
        description: "No video file is available for download yet.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setLocation('/projects');
  };

  if (projectLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={handleBack}>Back to Projects</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const autoCutResults = aiResults?.find(r => r.analysisType === 'auto-cut');
  const sceneResults = aiResults?.find(r => r.analysisType === 'scene-detection');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Created {new Date(project.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={
            project.status === 'completed' ? 'bg-green-100 text-green-700' :
            project.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
            project.status === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }>
            {project.status}
          </Badge>
          {(project.status === 'completed' || project.originalVideoPath) && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 mr-2"
              onClick={() => setLocation(`/editor/${projectId}`)}
            >
              <i className="fas fa-edit mr-2"></i>
              Edit Video
            </Button>
          )}
          {project.status === 'completed' && (
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleDownload}
            >
              <i className="fas fa-download mr-2"></i>
              Download Video
            </Button>
          )}
        </div>
      </div>

      {project.status === 'completed' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Processing Complete!</h3>
                <p className="text-green-700 text-sm">
                  Your video has been analyzed and processed. Review the AI insights below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-cut text-blue-500 mr-2"></i>
              Auto-Cut Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {autoCutResults ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI identified segments to cut or trim:
                </p>
                {autoCutResults.results?.segments?.map((segment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">{segment.type === 'filler' ? 'Filler Word' : 'Silence'}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                      </span>
                    </div>
                    <Badge variant="outline">{(segment.confidence * 100).toFixed(0)}% confident</Badge>
                  </div>
                )) || (
                  <p className="text-muted-foreground">No segments identified</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Auto-cut analysis not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-film text-purple-500 mr-2"></i>
              Scene Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sceneResults ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI detected scene changes:
                </p>
                {sceneResults.results?.scenes?.map((scene: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">Scene {index + 1}: {scene.description}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {scene.start}s - {scene.end}s
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">No scenes detected</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Scene detection not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-closed-captioning text-green-500 mr-2"></i>
              Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transcriptions && transcriptions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Auto-generated captions:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {transcriptions[0].segments?.map((segment, index) => (
                    <div key={index} className="p-2 bg-muted rounded">
                      <span className="text-xs text-muted-foreground">
                        {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                      </span>
                      <p className="text-sm">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Transcription not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-images text-orange-500 mr-2"></i>
              B-Roll Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brollSuggestions && brollSuggestions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI-suggested stock footage:
                </p>
                {brollSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-2 bg-muted rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{suggestion.keyword}</span>
                      <span className="text-sm text-muted-foreground">at {suggestion.timestamp}s</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.suggestions?.length || 0} clips available
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">B-Roll suggestions not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-music text-pink-500 mr-2"></i>
              Music Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            {musicMatches && musicMatches.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI-matched background music:
                </p>
                {musicMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">Track Match</span>
                      <div className="text-sm text-muted-foreground">
                        Match score: {(match.matchScore * 100).toFixed(0)}%
                      </div>
                    </div>
                    {match.selected && (
                      <Badge className="bg-green-100 text-green-700">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Music matching not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-info-circle text-gray-500 mr-2"></i>
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{project.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              {project.duration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              {project.fileSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{(project.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
