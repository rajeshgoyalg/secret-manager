import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Upload, Download, FolderPlus, UserPlus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h2 className="font-semibold">Quick Actions</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            className="flex flex-col items-center py-6 h-auto"
          >
            <Upload className="h-5 w-5 text-primary-500 mb-2" />
            <span className="text-sm text-center">Bulk Import</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center py-6 h-auto"
          >
            <Download className="h-5 w-5 text-primary-500 mb-2" />
            <span className="text-sm text-center">Bulk Export</span>
          </Button>
          
          <Link href="/projects">
            <Button
              variant="outline"
              className="flex flex-col items-center py-6 h-auto w-full"
            >
              <FolderPlus className="h-5 w-5 text-primary-500 mb-2" />
              <span className="text-sm text-center">New Project</span>
            </Button>
          </Link>
          
          <Link href="/user-management">
            <Button
              variant="outline"
              className="flex flex-col items-center py-6 h-auto w-full"
            >
              <UserPlus className="h-5 w-5 text-primary-500 mb-2" />
              <span className="text-sm text-center">Invite User</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
