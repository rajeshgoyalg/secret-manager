import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LockKeyhole, LayoutDashboard, Clock, Bell, Folder, User, ShieldCheck, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { type Project } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, setIsAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch projects for sidebar
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    // Skip fetching if user is not authenticated
    enabled: !!user
  });
  
  // Create a sidebar item class based on whether it's active
  const getItemClass = (path: string) => {
    const baseClass = "flex items-center gap-2 px-3 py-2 rounded-md transition-colors";
    return location === path
      ? `${baseClass} bg-primary-50 text-primary-500 font-medium`
      : `${baseClass} text-neutral-600 hover:bg-neutral-100`;
  };
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiRequest("POST", "/api/auth/logout", {});
      setIsAuthenticated(false);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive", 
        title: "Logout failed",
        description: "An error occurred during logout. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Use different CSS classes for mobile vs desktop
  const sidebarClass = isMobile 
    ? `${isOpen ? 'fixed' : 'hidden'} inset-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 ease-in-out`
    : "hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out z-20";
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div className={sidebarClass}>
        <div className="flex items-center p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-6 w-6 text-primary-500" />
            <h1 className="text-lg font-semibold">Secrets Manager</h1>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="p-4">
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-500 mb-2">Main</p>
              <ul className="space-y-1">
                <li>
                  <Link href="/" onClick={isMobile ? onClose : undefined}>
                    <a className={getItemClass("/")}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/activity" onClick={isMobile ? onClose : undefined}>
                    <a className={getItemClass("/activity")}>
                      <Clock className="h-4 w-4" />
                      <span>Recent Activity</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/notifications" onClick={isMobile ? onClose : undefined}>
                    <a className={getItemClass("/notifications")}>
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                      <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-500">Projects</p>
                <Link href="/projects" onClick={isMobile ? onClose : undefined}>
                  <Button variant="ghost" size="sm" className="h-6 text-primary-500 hover:text-primary-600 p-0">
                    <span className="flex items-center">
                      <span className="text-lg mr-1">+</span> New
                    </span>
                  </Button>
                </Link>
              </div>
              <ul className="space-y-1 text-sm">
                {isLoadingProjects ? (
                  <li className="px-3 py-2 text-neutral-400 text-sm">Loading projects...</li>
                ) : projects.length === 0 ? (
                  <li className="px-3 py-2 text-neutral-400 text-sm">No projects found</li>
                ) : (
                  projects.map(project => (
                    <li key={project.id}>
                      <Link href={`/projects/${project.id}`} onClick={isMobile ? onClose : undefined}>
                        <a className={getItemClass(`/projects/${project.id}`)}>
                          <Folder className="h-4 w-4 text-neutral-400" />
                          <span className="truncate">{project.name}</span>
                        </a>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            {user?.role === "admin" && (
              <div>
                <p className="text-sm font-medium text-neutral-500 mb-2">Settings</p>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/user-management" onClick={isMobile ? onClose : undefined}>
                      <a className={getItemClass("/user-management")}>
                        <User className="h-4 w-4" />
                        <span>User Management</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/permissions" onClick={isMobile ? onClose : undefined}>
                      <a className={getItemClass("/permissions")}>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Permissions</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" onClick={isMobile ? onClose : undefined}>
                      <a className={getItemClass("/settings")}>
                        <Settings className="h-4 w-4" />
                        <span>System Settings</span>
                      </a>
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center mr-2">
              {user?.fullName?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-neutral-500 truncate capitalize">{user?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="text-neutral-400 hover:text-neutral-600 p-1"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
