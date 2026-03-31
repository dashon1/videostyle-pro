import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StyleTemplate, PersonalityPreset, BrandVoiceTemplate } from "@shared/schema";

const pathToTab: Record<string, string> = {
  "/style/engine": "engine",
  "/style/presets": "presets",
  "/style/brand-voice": "brand-voice",
};

export default function StyleLearning() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const activeTab = pathToTab[location] || "engine";

  const { data: templates } = useQuery<StyleTemplate[]>({
    queryKey: ["/api/style-templates"],
  });

  const { data: presets } = useQuery<PersonalityPreset[]>({
    queryKey: ["/api/personality-presets"],
  });

  const { data: brandVoices } = useQuery<BrandVoiceTemplate[]>({
    queryKey: ["/api/brand-voice-templates"],
  });

  const createBrandVoiceMutation = useMutation({
    mutationFn: (data: Partial<BrandVoiceTemplate>) => 
      apiRequest("POST", "/api/brand-voice-templates", data),
    onSuccess: () => {
      toast({ title: "Brand voice template created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-voice-templates"] });
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Style Learning</h1>
        <p className="text-muted-foreground mt-2">
          Train the AI to match your unique editing style and brand voice
        </p>
      </div>

      <Tabs 
        value={activeTab}
        onValueChange={(value) => {
          const tabToPath: Record<string, string> = {
            "engine": "/style/engine",
            "presets": "/style/presets",
            "brand-voice": "/style/brand-voice",
          };
          setLocation(tabToPath[value] || "/style/engine");
        }}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="engine" data-testid="tab-engine">Style Engine</TabsTrigger>
          <TabsTrigger value="presets" data-testid="tab-presets">Personality Presets</TabsTrigger>
          <TabsTrigger value="brand-voice" data-testid="tab-brand-voice">Brand Voice</TabsTrigger>
        </TabsList>

        <TabsContent value="engine" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-sliders-h text-primary"></i>
                Style Learning Engine
              </CardTitle>
              <CardDescription>
                Analyze your existing videos to learn your exact editing patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg border border-dashed border-border text-center">
                <i className="fas fa-brain text-5xl text-muted-foreground mb-4"></i>
                <h4 className="font-medium text-lg mb-2">Train Your Style</h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Upload 5-10 of your best edited videos and our AI will analyze your editing patterns, 
                  cut timing, transitions, and pacing preferences.
                </p>
                <Button size="lg" data-testid="button-upload-training-videos">
                  <i className="fas fa-upload mr-2"></i>
                  Upload Training Videos
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Current Style Profile</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Average Cut Duration</span>
                        <span className="text-muted-foreground">3.2s</span>
                      </div>
                      <Slider defaultValue={[32]} max={100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Pacing</span>
                        <span className="text-muted-foreground">Fast</span>
                      </div>
                      <Slider defaultValue={[75]} max={100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Zoom Frequency</span>
                        <span className="text-muted-foreground">Medium</span>
                      </div>
                      <Slider defaultValue={[50]} max={100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Text Overlay Usage</span>
                        <span className="text-muted-foreground">High</span>
                      </div>
                      <Slider defaultValue={[80]} max={100} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Detected Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>Hard Cuts</Badge>
                      <Badge>Zoom In/Out</Badge>
                      <Badge variant="outline">Cross Dissolve</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Pop-in Text</Badge>
                      <Badge>Scale Animations</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Vibrant Colors</Badge>
                      <Badge variant="secondary">High Contrast</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on analysis of 8 videos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-user-astronaut text-primary"></i>
                Personality Presets
              </CardTitle>
              <CardDescription>
                Import editing styles from popular creators as starting points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {presets?.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-4 rounded-lg border text-left transition-all hover:shadow-lg ${
                      selectedPreset === preset.id
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`preset-${preset.id}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {preset.creatorName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{preset.name}</h3>
                        <p className="text-sm text-muted-foreground">{preset.creatorName}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {preset.learnedPatterns?.transitionPreferences?.slice(0, 3).map((pref, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{pref}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Learned from {preset.sourceVideoCount} videos
                    </div>
                  </button>
                ))}
              </div>

              {selectedPreset && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Apply This Style</h4>
                    <Button data-testid="button-apply-preset">
                      <i className="fas fa-magic mr-2"></i>
                      Apply to Projects
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will use the selected personality preset as a base for processing your videos. 
                    You can further customize the output.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand-voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-bullhorn text-primary"></i>
                Brand Voice Templates
              </CardTitle>
              <CardDescription>
                Capture your intro/outro patterns, lower thirds style, and graphic treatments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Intro Pattern</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Slider defaultValue={[5]} max={15} className="mt-2" />
                    </div>
                    <div>
                      <Label>Elements</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">Logo Animation</Badge>
                        <Badge variant="outline">Music Sting</Badge>
                        <Badge variant="outline">Text Intro</Badge>
                        <Button size="sm" variant="ghost">
                          <i className="fas fa-plus"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Outro Pattern</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Slider defaultValue={[8]} max={20} className="mt-2" />
                    </div>
                    <div>
                      <Label>Call to Action</Label>
                      <Input placeholder="Subscribe for more!" className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Lower Thirds Style</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer">
                    <div className="h-8 bg-primary/80 rounded mb-2 flex items-center px-2">
                      <span className="text-xs text-white">Speaker Name</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Modern</span>
                  </div>
                  <div className="p-4 rounded-lg border border-primary bg-primary/10 cursor-pointer">
                    <div className="h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-2 flex items-center px-2">
                      <span className="text-xs text-white">Speaker Name</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Gradient</span>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer">
                    <div className="h-8 border-b-2 border-primary mb-2 flex items-end px-2 pb-1">
                      <span className="text-xs">Speaker Name</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Minimal</span>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer">
                    <div className="h-8 bg-black/80 rounded-full mb-2 flex items-center justify-center">
                      <span className="text-xs text-white">Speaker</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Pill</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => createBrandVoiceMutation.mutate({ name: "My Brand Voice" })}
                disabled={createBrandVoiceMutation.isPending}
                data-testid="button-save-brand-voice"
              >
                <i className="fas fa-save mr-2"></i>
                Save Brand Voice Template
              </Button>

              {brandVoices && brandVoices.length > 0 && (
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-medium">Saved Brand Voices</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {brandVoices.map((voice) => (
                      <div key={voice.id} className="p-4 rounded-lg border border-border">
                        <h5 className="font-medium">{voice.name}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {new Date(voice.createdAt || "").toLocaleDateString()}
                        </p>
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                          Apply
                        </Button>
                      </div>
                    ))}
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
