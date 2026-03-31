import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import Templates from "@/pages/templates";
import Projects from "@/pages/projects";
import BrandAssets from "@/pages/brand-assets";
import Exports from "@/pages/exports";
import AIFeatures from "@/pages/ai-features";
import StyleLearning from "@/pages/style-learning";
import Automation from "@/pages/automation";
import Publishing from "@/pages/publishing";
import Collaboration from "@/pages/collaboration";
import Marketplace from "@/pages/marketplace";
import Analytics from "@/pages/analytics";
import ProjectDetail from "@/pages/project-detail";
import VideoEditor from "@/pages/video-editor";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/upload" component={Upload} />
        <Route path="/templates" component={Templates} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/editor/:id" component={VideoEditor} />
        <Route path="/brand-assets" component={BrandAssets} />
        <Route path="/exports" component={Exports} />
        
        {/* AI Features */}
        <Route path="/ai/auto-cut" component={AIFeatures} />
        <Route path="/ai/scenes" component={AIFeatures} />
        <Route path="/ai/b-roll" component={AIFeatures} />
        <Route path="/ai/voice-clone" component={AIFeatures} />
        <Route path="/ai/thumbnails" component={AIFeatures} />
        
        {/* Style Learning */}
        <Route path="/style/engine" component={StyleLearning} />
        <Route path="/style/presets" component={StyleLearning} />
        <Route path="/style/brand-voice" component={StyleLearning} />
        
        {/* Automation */}
        <Route path="/automation/transcription" component={Automation} />
        <Route path="/automation/music" component={Automation} />
        <Route path="/automation/batch" component={Automation} />
        <Route path="/automation/watch-folders" component={Automation} />
        
        {/* Publishing */}
        <Route path="/publish/connections" component={Publishing} />
        <Route path="/publish/schedule" component={Publishing} />
        <Route path="/publish/formats" component={Publishing} />
        
        {/* Collaboration */}
        <Route path="/collab/teams" component={Collaboration} />
        <Route path="/collab/review" component={Collaboration} />
        <Route path="/collab/versions" component={Collaboration} />
        
        {/* Marketplace & Analytics */}
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/analytics" component={Analytics} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
