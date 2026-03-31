import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TemplateCard from "@/components/TemplateCard";
import type { StyleTemplate, InsertStyleTemplate } from "@shared/schema";
import { insertStyleTemplateSchema } from "@shared/schema";

export default function Templates() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<InsertStyleTemplate>({
    name: "",
    description: "",
    icon: "fas fa-palette",
    colorScheme: "blue",
    settings: {
      cutFrequency: 5,
      transitionType: "fade",
      musicStyle: "corporate",
      textStyle: "minimal",
      brandingPosition: "bottom-right",
      pacing: "moderate"
    }
  });

  const { data: templates, isLoading } = useQuery<StyleTemplate[]>({
    queryKey: ["/api/style-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertStyleTemplate) => {
      return apiRequest("POST", "/api/style-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/style-templates"] });
      setShowCreateDialog(false);
      setFormData({
        name: "",
        description: "",
        icon: "fas fa-palette",
        colorScheme: "blue",
        settings: {
          cutFrequency: 5,
          transitionType: "fade",
          musicStyle: "corporate",
          textStyle: "minimal",
          brandingPosition: "bottom-right",
          pacing: "moderate"
        }
      });
      toast({
        title: "Template created successfully",
        description: "Your new style template is ready to use.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create template",
        description: "There was an error creating your template.",
        variant: "destructive",
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/style-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/style-templates"] });
      toast({
        title: "Template deleted",
        description: "The style template has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete template",
        description: "There was an error deleting the template.",
        variant: "destructive",
      });
    }
  });

  const handleCreateTemplate = () => {
    try {
      const validatedData = insertStyleTemplateSchema.parse(formData);
      createTemplateMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Invalid form data",
        description: "Please check all fields and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = (template: StyleTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Style Templates</h2>
            <p className="text-muted-foreground">Create and manage your editing style templates</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-template">
                <i className="fas fa-plus mr-2"></i>
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Style Template</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Corporate Clean"
                      data-testid="input-template-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="color-scheme">Color Scheme</Label>
                    <Select 
                      value={formData.colorScheme} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, colorScheme: value }))}
                    >
                      <SelectTrigger data-testid="select-color-scheme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the template style"
                    data-testid="input-template-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cut Frequency (cuts per minute)</Label>
                    <Slider
                      value={[formData.settings.cutFrequency]}
                      onValueChange={([value]) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, cutFrequency: value }
                        }))
                      }
                      max={20}
                      min={1}
                      step={1}
                      className="mt-2"
                      data-testid="slider-cut-frequency"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.settings.cutFrequency} cuts/min
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="pacing">Pacing</Label>
                    <Select 
                      value={formData.settings.pacing} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, pacing: value }
                        }))
                      }
                    >
                      <SelectTrigger data-testid="select-pacing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transition-type">Transition Type</Label>
                    <Select 
                      value={formData.settings.transitionType} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, transitionType: value }
                        }))
                      }
                    >
                      <SelectTrigger data-testid="select-transition-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="crossfade">Crossfade</SelectItem>
                        <SelectItem value="quick-cuts">Quick Cuts</SelectItem>
                        <SelectItem value="dissolve">Dissolve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="music-style">Music Style</Label>
                    <Select 
                      value={formData.settings.musicStyle} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, musicStyle: value }
                        }))
                      }
                    >
                      <SelectTrigger data-testid="select-music-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="upbeat">Upbeat</SelectItem>
                        <SelectItem value="ambient">Ambient</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="none">No Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="text-style">Text Style</Label>
                    <Select 
                      value={formData.settings.textStyle} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, textStyle: value }
                        }))
                      }
                    >
                      <SelectTrigger data-testid="select-text-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="subtitle">Subtitle</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="branding-position">Branding Position</Label>
                    <Select 
                      value={formData.settings.brandingPosition} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          settings: { ...prev.settings, brandingPosition: value }
                        }))
                      }
                    >
                      <SelectTrigger data-testid="select-branding-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-template"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTemplate}
                    disabled={!formData.name.trim() || createTemplateMutation.isPending}
                    data-testid="button-save-template"
                  >
                    {createTemplateMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-save mr-2"></i>
                    )}
                    Save Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : templates?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <i className="fas fa-palette text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No style templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first style template to automate video editing with consistent branding and pacing.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-template">
                <i className="fas fa-plus mr-2"></i>
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={(template) => {
                  setFormData(template);
                  setShowCreateDialog(true);
                }}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
