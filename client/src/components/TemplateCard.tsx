import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StyleTemplate } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: StyleTemplate;
  onEdit?: (template: StyleTemplate) => void;
  onDelete?: (template: StyleTemplate) => void;
  onUse?: (template: StyleTemplate) => void;
}

export default function TemplateCard({ template, onEdit, onDelete, onUse }: TemplateCardProps) {
  const getIconColor = (colorScheme: string) => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'red': return 'bg-red-100 text-red-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", getIconColor(template.colorScheme || 'blue'))}>
              <i className={template.icon || "fas fa-palette"}></i>
            </div>
            <div className="min-w-0 flex-1">
              <p 
                className="text-sm font-medium text-foreground"
                data-testid={`template-name-${template.id}`}
              >
                {template.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {template.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span 
              className="text-xs text-muted-foreground"
              data-testid={`template-usage-${template.id}`}
            >
              {template.usageCount} uses
            </span>
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(template)}
                data-testid={`button-edit-template-${template.id}`}
              >
                <i className="fas fa-edit text-sm"></i>
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(template)}
                data-testid={`button-delete-template-${template.id}`}
              >
                <i className="fas fa-trash text-sm text-destructive"></i>
              </Button>
            )}
            {onUse && (
              <Button
                size="sm"
                onClick={() => onUse(template)}
                data-testid={`button-use-template-${template.id}`}
              >
                Use Template
              </Button>
            )}
          </div>
        </div>
        
        {template.settings && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Cuts: {template.settings.cutFrequency}/min</div>
              <div>Pacing: {template.settings.pacing}</div>
              <div>Transition: {template.settings.transitionType}</div>
              <div>Music: {template.settings.musicStyle}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
