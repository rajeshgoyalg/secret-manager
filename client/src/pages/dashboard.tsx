import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { StatsCard } from "@/components/ui/stats-card";
import { SecretTable } from "@/components/secrets/secret-table";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { QuickActions } from "@/components/quick-actions";
import { AIAssistant } from "@/components/ai-assistant";
import { Key, Folder, Clock, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  // Fetch data for stats
  const { data: secrets = [] } = useQuery({
    queryKey: ['/api/secrets'],
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['/api/activity-logs'],
  });
  
  // Get recent activity count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentActivityCount = activityLogs.filter((log: any) => {
    const logDate = new Date(log.timestamp);
    return logDate >= sevenDaysAgo;
  }).length;
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold mb-1">Welcome back, {user?.fullName?.split(' ')[0] || user?.username}</h1>
            <p className="text-neutral-500">Here's what's happening with your secrets today.</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              icon={<Key />}
              label="Total Secrets"
              value={secrets.length}
              bgColor="bg-primary-50"
              textColor="text-primary-500"
            />
            
            <StatsCard 
              icon={<Folder />}
              label="Projects"
              value={projects.length}
              bgColor="bg-secondary-500/10"
              textColor="text-secondary-500"
            />
            
            <StatsCard 
              icon={<Clock />}
              label="Recent Changes"
              value={recentActivityCount}
              bgColor="bg-warning-500/10"
              textColor="text-warning-500"
              subLabel="Last 7 days"
            />
            
            <StatsCard 
              icon={<Users />}
              label="Team Members"
              value={8} // This would come from a team members API in a real app
              bgColor="bg-success-500/10"
              textColor="text-success-500"
            />
          </div>
          
          {/* Projects and Secrets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (Secrets Table) */}
            <div className="lg:col-span-2">
              <SecretTable />
            </div>
            
            {/* Sidebar Content (Activity & AI) */}
            <div className="space-y-6">
              <ActivityFeed />
              <AIAssistant />
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
