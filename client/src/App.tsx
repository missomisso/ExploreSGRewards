import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Business from "@/pages/business";
import Rewards from "@/pages/rewards";
import MissionDetail from "@/pages/mission-detail";
import SuperAdminDashboard from "@/pages/admin/super-dashboard";
import BusinessAdminDashboard from "@/pages/admin/business-dashboard";
import CreateMission from "@/pages/admin/create-mission";
import VerificationCenter from "@/pages/admin/verification-center";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/business" component={Business} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/mission/:id" component={MissionDetail} />
      <Route path="/profile" component={Profile} />

      {/* Admin Routes */}
      <Route path="/admin/super" component={SuperAdminDashboard} />
      <Route path="/admin/business" component={BusinessAdminDashboard} />
      <Route path="/admin/business/missions/new" component={CreateMission} />
      <Route
        path="/admin/business/verification"
        component={VerificationCenter}
      />

      <Route component={NotFound} />
    </Switch>
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
