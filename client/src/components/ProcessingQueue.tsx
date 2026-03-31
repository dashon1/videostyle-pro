import { useQuery } from "@tanstack/react-query";
import type { ProcessingJob, Project } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function ProcessingQueue() {
  const { data: jobs, isLoading } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/processing-jobs/active"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeJobs = jobs || [];

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Processing Queue</h3>
        <span 
          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full"
          data-testid="active-jobs-count"
        >
          {activeJobs.length} active
        </span>
      </div>
      
      <div className="space-y-3">
        {activeJobs.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-clock text-4xl text-muted-foreground mb-2"></i>
            <p className="text-sm text-muted-foreground">No jobs in queue</p>
          </div>
        ) : (
          activeJobs.slice(0, 3).map((job, index) => {
            const project = projects?.find(p => p.id === job.projectId);
            return (
              <div key={job.id} className="p-3 border border-border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground" data-testid={`job-name-${job.id}`}>
                    {project?.name || `Job ${job.id.slice(0, 8)}`}
                  </p>
                  <span 
                    className={cn(
                      "text-xs font-medium",
                      job.status === 'processing' 
                        ? "text-primary animate-pulse" 
                        : "text-muted-foreground"
                    )}
                    data-testid={`job-status-${job.id}`}
                  >
                    {job.status === 'processing' ? 'Processing' : 'Queued'}
                  </span>
                </div>
                {job.status === 'processing' && (
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${job.progress || 0}%` }}
                      data-testid={`job-progress-${job.id}`}
                    ></div>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span data-testid={`job-template-${job.id}`}>
                    Style: {project?.styleTemplateId ? 'Applied' : 'Default'}
                  </span>
                  <span data-testid={`job-time-${job.id}`}>
                    {job.status === 'processing' 
                      ? `~${job.estimatedTimeLeft || 0} min left`
                      : `Position #${index + 1}`
                    }
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {activeJobs.length > 3 && (
        <button 
          className="w-full mt-4 text-primary hover:text-primary/80 text-sm font-medium"
          data-testid="button-view-all-jobs"
        >
          View All Jobs
        </button>
      )}
    </div>
  );
}
