import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StyleTemplate, TemplateReview, TemplatePurchase } from "@shared/schema";

export default function Marketplace() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);

  const { data: templates } = useQuery<StyleTemplate[]>({
    queryKey: ["/api/marketplace/templates"],
  });

  const { data: purchases } = useQuery<TemplatePurchase[]>({
    queryKey: ["/api/marketplace/purchases"],
  });

  const { data: reviews } = useQuery<TemplateReview[]>({
    queryKey: ["/api/marketplace/templates", selectedTemplate?.id, "reviews"],
    enabled: !!selectedTemplate,
  });

  const purchaseMutation = useMutation({
    mutationFn: (templateId: string) => 
      apiRequest("POST", `/api/marketplace/templates/${templateId}/purchase`, {
        buyerId: "default"
      }),
    onSuccess: () => {
      toast({ title: "Template purchased successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/purchases"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ templateId, rating, review }: { templateId: string; rating: number; review: string }) => 
      apiRequest("POST", `/api/marketplace/templates/${templateId}/reviews`, {
        userId: "default",
        rating,
        review
      }),
    onSuccess: () => {
      toast({ title: "Review submitted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/templates", selectedTemplate?.id, "reviews"] });
    },
  });

  const filteredTemplates = templates?.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isPurchased = (templateId: string) => 
    purchases?.some(p => p.templateId === templateId);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <i 
            key={star} 
            className={`fas fa-star text-sm ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          ></i>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Template Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Browse, buy, and sell professional video editing templates
          </p>
        </div>
        <Button data-testid="button-sell-template">
          <i className="fas fa-plus mr-2"></i>
          Sell Your Template
        </Button>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse" data-testid="tab-browse">Browse</TabsTrigger>
          <TabsTrigger value="purchased" data-testid="tab-purchased">My Purchases</TabsTrigger>
          <TabsTrigger value="selling" data-testid="tab-selling">My Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
              <Input 
                placeholder="Search templates..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-templates"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates?.map((template) => (
              <Card 
                key={template.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center relative">
                  <i className={`${template.icon} text-4xl text-white/80`}></i>
                  {template.price && template.price > 0 ? (
                    <Badge className="absolute top-2 right-2 bg-black/50">
                      ${template.price.toFixed(2)}
                    </Badge>
                  ) : (
                    <Badge className="absolute top-2 right-2 bg-green-500">Free</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(template.rating || 0)}
                      <span className="text-xs text-muted-foreground">
                        ({template.reviewCount || 0})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {template.usageCount || 0} uses
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedTemplate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                      <CardDescription>{selectedTemplate.category}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <i className={`${selectedTemplate.icon} text-6xl text-white/80`}></i>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(selectedTemplate.rating || 0)}
                      <span className="text-sm text-muted-foreground">
                        ({selectedTemplate.reviewCount || 0} reviews)
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {selectedTemplate.price && selectedTemplate.price > 0 
                        ? `$${selectedTemplate.price.toFixed(2)}`
                        : "Free"}
                    </div>
                  </div>

                  <p className="text-muted-foreground">{selectedTemplate.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Cut Frequency</span>
                      <p className="font-medium">{selectedTemplate.settings?.cutFrequency} per minute</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Transition Type</span>
                      <p className="font-medium">{selectedTemplate.settings?.transitionType}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Pacing</span>
                      <p className="font-medium">{selectedTemplate.settings?.pacing}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Music Style</span>
                      <p className="font-medium">{selectedTemplate.settings?.musicStyle}</p>
                    </div>
                  </div>

                  {isPurchased(selectedTemplate.id) ? (
                    <Button className="w-full" variant="outline" data-testid="button-use-template">
                      <i className="fas fa-check mr-2"></i>
                      Use This Template
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => purchaseMutation.mutate(selectedTemplate.id)}
                      disabled={purchaseMutation.isPending}
                      data-testid="button-purchase-template"
                    >
                      <i className="fas fa-shopping-cart mr-2"></i>
                      {selectedTemplate.price && selectedTemplate.price > 0 
                        ? `Purchase for $${selectedTemplate.price.toFixed(2)}`
                        : "Get for Free"}
                    </Button>
                  )}

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-4">Reviews</h4>
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              {renderStars(review.rating)}
                              <span className="text-xs text-muted-foreground">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                            <p className="text-sm">{review.review}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No reviews yet. Be the first to review!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Purchased Templates</CardTitle>
              <CardDescription>Templates you've acquired from the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases && purchases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchases.map((purchase) => {
                    const template = templates?.find(t => t.id === purchase.templateId);
                    return (
                      <div key={purchase.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
                            <i className={`${template?.icon || "fas fa-palette"} text-primary`}></i>
                          </div>
                          <div>
                            <h4 className="font-medium">{template?.name || "Unknown"}</h4>
                            <p className="text-xs text-muted-foreground">
                              Purchased {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Use Template
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-shopping-bag text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">No purchases yet</p>
                  <Button variant="link" className="mt-2">Browse Marketplace</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Templates for Sale</CardTitle>
              <CardDescription>Manage your listings on the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <i className="fas fa-store text-4xl text-muted-foreground mb-4"></i>
                <h4 className="font-medium mb-2">Start Selling</h4>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Turn your successful editing templates into passive income. 
                  List your templates and earn money when other creators use them.
                </p>
                <Button data-testid="button-create-listing">
                  <i className="fas fa-plus mr-2"></i>
                  Create Your First Listing
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">$0.00</div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
