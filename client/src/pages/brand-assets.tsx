import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { UploadResult } from "@uppy/core";
import type { BrandAsset, InsertBrandAsset } from "@shared/schema";
import { insertBrandAssetSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function BrandAssets() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [assetType, setAssetType] = useState<string>("logo");
  const [formData, setFormData] = useState<InsertBrandAsset>({
    name: "",
    type: "logo",
    filePath: null,
    metadata: {}
  });
  const [uploadedFilePath, setUploadedFilePath] = useState<string>();
  const [colorInputs, setColorInputs] = useState<string[]>(["#3b82f6"]);

  const { data: assets, isLoading } = useQuery<BrandAsset[]>({
    queryKey: ["/api/brand-assets"],
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: InsertBrandAsset) => {
      return apiRequest("POST", "/api/brand-assets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-assets"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Asset created successfully",
        description: "Your brand asset has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create asset",
        description: "There was an error creating your brand asset.",
        variant: "destructive",
      });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BrandAsset> }) => {
      return apiRequest("PUT", `/api/brand-assets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-assets"] });
      toast({
        title: "Asset updated successfully",
        description: "Your brand asset has been updated.",
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/brand-assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-assets"] });
      toast({
        title: "Asset deleted",
        description: "The brand asset has been removed.",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const uploadedFile = result.successful?.[0];
    if (uploadedFile) {
      setUploadedFilePath(uploadedFile.uploadURL);
      if (!formData.name) {
        setFormData(prev => ({ 
          ...prev, 
          name: uploadedFile.name?.replace(/\.[^/.]+$/, "") || "New Asset" 
        }));
      }
      toast({
        title: "File uploaded successfully",
        description: "Configure your asset details below.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "logo",
      filePath: null,
      metadata: {}
    });
    setUploadedFilePath(undefined);
    setColorInputs(["#3b82f6"]);
    setAssetType("logo");
  };

  const handleCreateAsset = () => {
    try {
      let metadata = {};
      let filePath = uploadedFilePath || null;

      if (assetType === "colorScheme") {
        metadata = { colors: colorInputs.filter(color => color.trim()) };
      } else if (assetType === "font") {
        metadata = {
          fontFamily: formData.metadata?.fontFamily || formData.name,
          fontWeight: formData.metadata?.fontWeight || "400"
        };
      }

      const assetData: InsertBrandAsset = {
        ...formData,
        type: assetType,
        filePath,
        metadata
      };

      const validatedData = insertBrandAssetSchema.parse(assetData);
      createAssetMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Invalid form data",
        description: "Please check all fields and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAsset = (asset: BrandAsset) => {
    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteAssetMutation.mutate(asset.id);
    }
  };

  const addColorInput = () => {
    setColorInputs(prev => [...prev, "#000000"]);
  };

  const updateColorInput = (index: number, color: string) => {
    setColorInputs(prev => prev.map((c, i) => i === index ? color : c));
  };

  const removeColorInput = (index: number) => {
    setColorInputs(prev => prev.filter((_, i) => i !== index));
  };

  const groupedAssets = {
    logo: assets?.filter(asset => asset.type === "logo") || [],
    intro: assets?.filter(asset => asset.type === "intro") || [],
    outro: assets?.filter(asset => asset.type === "outro") || [],
    colorScheme: assets?.filter(asset => asset.type === "colorScheme") || [],
    font: assets?.filter(asset => asset.type === "font") || []
  };

  return (
    <>
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Brand Assets</h2>
            <p className="text-muted-foreground">Manage your brand elements for consistent video styling</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-asset">
                <i className="fas fa-plus mr-2"></i>
                Upload Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Brand Asset</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="asset-type">Asset Type</Label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger data-testid="select-asset-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="logo">Logo</SelectItem>
                      <SelectItem value="intro">Intro Video</SelectItem>
                      <SelectItem value="outro">Outro Video</SelectItem>
                      <SelectItem value="colorScheme">Color Scheme</SelectItem>
                      <SelectItem value="font">Font</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="asset-name">Asset Name</Label>
                  <Input
                    id="asset-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Primary Logo"
                    data-testid="input-asset-name"
                  />
                </div>

                {(assetType === "logo" || assetType === "intro" || assetType === "outro") && (
                  <div>
                    <Label>Upload File</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={50 * 1024 * 1024} // 50MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full mt-2"
                    >
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                        <i className="fas fa-cloud-upload-alt text-xl text-muted-foreground mb-2"></i>
                        <p className="text-sm text-foreground">Choose File</p>
                      </div>
                    </ObjectUploader>
                    
                    {uploadedFilePath && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700">File uploaded successfully</p>
                      </div>
                    )}
                  </div>
                )}

                {assetType === "colorScheme" && (
                  <div>
                    <Label>Colors</Label>
                    <div className="space-y-2 mt-2">
                      {colorInputs.map((color, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => updateColorInput(index, e.target.value)}
                            className="w-12 h-8 rounded border border-border"
                            data-testid={`input-color-${index}`}
                          />
                          <Input
                            value={color}
                            onChange={(e) => updateColorInput(index, e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                          {colorInputs.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeColorInput(index)}
                              data-testid={`button-remove-color-${index}`}
                            >
                              <i className="fas fa-trash text-destructive"></i>
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addColorInput}
                        data-testid="button-add-color"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Color
                      </Button>
                    </div>
                  </div>
                )}

                {assetType === "font" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="font-family">Font Family</Label>
                      <Input
                        id="font-family"
                        value={formData.metadata?.fontFamily || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, fontFamily: e.target.value }
                        }))}
                        placeholder="e.g. Montserrat"
                        data-testid="input-font-family"
                      />
                    </div>
                    <div>
                      <Label htmlFor="font-weight">Font Weight</Label>
                      <Select 
                        value={formData.metadata?.fontWeight as string || "400"}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, fontWeight: value }
                        }))}
                      >
                        <SelectTrigger data-testid="select-font-weight">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">Light (300)</SelectItem>
                          <SelectItem value="400">Regular (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                          <SelectItem value="800">Extra Bold (800)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-asset"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAsset}
                    disabled={!formData.name.trim() || createAssetMutation.isPending}
                    data-testid="button-save-asset"
                  >
                    {createAssetMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-save mr-2"></i>
                    )}
                    Save Asset
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logos & Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Logos & Media</span>
                  <Badge variant="secondary" data-testid="logos-count">
                    {groupedAssets.logo.length + groupedAssets.intro.length + groupedAssets.outro.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedAssets.logo.length === 0 && groupedAssets.intro.length === 0 && groupedAssets.outro.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-image text-4xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground">No logos or media files yet</p>
                    </div>
                  ) : (
                    <>
                      {groupedAssets.logo.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-md border border-border flex items-center justify-center">
                              {asset.filePath ? (
                                <img 
                                  src={asset.filePath} 
                                  alt={asset.name} 
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <i className="fas fa-image text-muted-foreground"></i>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground" data-testid={`asset-name-${asset.id}`}>
                                {asset.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAsset(asset)}
                              data-testid={`button-delete-asset-${asset.id}`}
                            >
                              <i className="fas fa-trash text-destructive"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {groupedAssets.intro.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-md border border-border flex items-center justify-center">
                              <i className="fas fa-video text-muted-foreground"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">Intro Video</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAsset(asset)}
                          >
                            <i className="fas fa-trash text-destructive"></i>
                          </Button>
                        </div>
                      ))}
                      
                      {groupedAssets.outro.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-md border border-border flex items-center justify-center">
                              <i className="fas fa-video text-muted-foreground"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">Outro Video</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAsset(asset)}
                          >
                            <i className="fas fa-trash text-destructive"></i>
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Color Schemes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Color Schemes</span>
                  <Badge variant="secondary" data-testid="colors-count">
                    {groupedAssets.colorScheme.length} schemes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedAssets.colorScheme.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-palette text-4xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground">No color schemes yet</p>
                    </div>
                  ) : (
                    groupedAssets.colorScheme.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            {asset.metadata?.colors?.slice(0, 3).map((color, idx) => (
                              <div 
                                key={idx} 
                                className="w-6 h-6 rounded-full border border-border"
                                style={{ backgroundColor: color }}
                                data-testid={`color-${asset.id}-${idx}`}
                              ></div>
                            ))}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground" data-testid={`scheme-name-${asset.id}`}>
                              {asset.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {asset.metadata?.colors?.length || 0} colors
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAsset(asset)}
                          data-testid={`button-delete-scheme-${asset.id}`}
                        >
                          <i className="fas fa-trash text-destructive"></i>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fonts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Typography</span>
                  <Badge variant="secondary" data-testid="fonts-count">
                    {groupedAssets.font.length} fonts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedAssets.font.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-font text-4xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground">No fonts configured yet</p>
                    </div>
                  ) : (
                    groupedAssets.font.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                        <div className="flex-1">
                          <p 
                            className="text-sm font-medium text-foreground"
                            style={{ 
                              fontFamily: asset.metadata?.fontFamily,
                              fontWeight: asset.metadata?.fontWeight
                            }}
                            data-testid={`font-name-${asset.id}`}
                          >
                            {asset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.metadata?.fontFamily} - {asset.metadata?.fontWeight === "700" ? "Bold" : "Regular"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {asset.metadata?.fontWeight === "700" ? "Headings" : "Body"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAsset(asset)}
                            data-testid={`button-delete-font-${asset.id}`}
                          >
                            <i className="fas fa-trash text-destructive"></i>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Logo Requirements</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>PNG or SVG format recommended</li>
                      <li>Transparent background preferred</li>
                      <li>Minimum resolution: 512x512px</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Color Guidelines</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Use 2-4 colors per scheme</li>
                      <li>Ensure sufficient contrast ratios</li>
                      <li>Test colors across different devices</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Font Selection</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Choose web-safe font families</li>
                      <li>Limit to 2-3 font families maximum</li>
                      <li>Consider readability at small sizes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
