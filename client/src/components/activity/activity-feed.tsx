import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2, UserPlus } from "lucide-react";
import { ActivityLog } from "@shared/schema";

interface ActivityFeedProps {
  projectId?: number;
  limit?: number;
}

export function ActivityFeed({ projectId, limit = 4 }: ActivityFeedProps) {
  // Fetch activity logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: projectId 
      ? [`/api/projects/${projectId}/activity-logs`]
      : ['/api/activity-logs'],
  });
  
  // Limit the number of logs to display
  const displayLogs = logs.slice(0, limit);
  
  // Get icon for action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <PlusCircle className="text-success-500" />;
      case 'updated':
        return <Edit className="text-warning-500" />;
      case 'deleted':
        return <Trash2 className="text-danger-500" />;
      case 'assigned':
        return <UserPlus className="text-primary-500" />;
      default:
        return <PlusCircle className="text-primary-500" />;
    }
  };
  
  // Get color classes for action type
  const getActionColorClasses = (action: string) => {
    switch (action) {
      case 'created':
        return "bg-success-50";
      case 'updated':
        return "bg-warning-50";
      case 'deleted':
        return "bg-danger-50";
      case 'assigned':
        return "bg-primary-50";
      default:
        return "bg-primary-50";
    }
  };
  
  // Format timestamp
  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} year${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} month${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} day${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    }
    
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
  };
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-200">
        <h2 className="font-semibold">Recent Activity</h2>
        <a href="#" className="text-sm text-primary-500 hover:text-primary-600">View All</a>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : displayLogs.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            No activity found.
          </div>
        ) : (
          <div className="space-y-4">
            {displayLogs.map((log: ActivityLog & { user?: { username: string } }) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-8 h-8 rounded-full ${getActionColorClasses(log.action)} flex items-center justify-center`}>
                    {getActionIcon(log.action)}
                  </div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{log.user?.username || 'Unknown user'}</span>{' '}
                    {log.action}{' '}
                    {log.resourceType === 'secret' ? 'secret' : log.resourceType}{' '}
                    <span className="font-medium">{log.details}</span>
                  </p>
                  <p className="text-xs text-neutral-500">{formatTimeAgo(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
