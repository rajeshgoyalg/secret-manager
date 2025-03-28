import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Secret, Project } from "@shared/schema";
import { Eye, EyeOff, Copy, Pencil, Trash2, Key, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SecretForm } from "./secret-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SecretTableProps {
  projectId?: number;
}

export function SecretTable({ projectId }: SecretTableProps) {
  const [selectedProject, setSelectedProject] = useState<string>(projectId ? projectId.toString() : "all");
  const [sortBy, setSortBy] = useState<string>("lastModified");
  const [secretType, setSecretType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [visibleValues, setVisibleValues] = useState<Record<number, boolean>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch secrets
  const { data: secrets = [], isLoading: secretsLoading } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/secrets`] : ['/api/secrets'],
  });
  
  // Fetch projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Mutation for deleting a secret
  const deleteMutation = useMutation({
    mutationFn: async (secretId: number) => {
      return apiRequest("DELETE", `/api/secrets/${secretId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secrets'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/secrets`] });
      }
      
      setIsDeleteDialogOpen(false);
      toast({
        title: "Secret deleted",
        description: "The secret has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete secret:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the secret. Please try again.",
      });
    }
  });
  
  // Filter and sort secrets
  const filteredSecrets = secrets.filter((secret: Secret) => {
    if (selectedProject !== "all" && secret.projectId !== parseInt(selectedProject)) {
      return false;
    }
    
    return true;
  });
  
  // Pagination
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredSecrets.length / ITEMS_PER_PAGE);
  const paginatedSecrets = filteredSecrets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  
  // Toggle secret visibility
  const toggleSecretVisibility = (secretId: number) => {
    setVisibleValues(prev => ({
      ...prev,
      [secretId]: !prev[secretId]
    }));
  };
  
  // Copy secret value to clipboard
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied to clipboard",
      description: "Secret value has been copied to your clipboard.",
    });
  };
  
  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  // Get color classes for project badge
  const getProjectColorClasses = (projectId: number) => {
    const colorMap: Record<number, string> = {
      1: "bg-primary-50 text-primary-700",
      2: "bg-success-500/10 text-success-700",
      3: "bg-warning-500/10 text-warning-700",
      4: "bg-secondary-500/10 text-secondary-700",
    };
    
    return colorMap[projectId] || "bg-neutral-100 text-neutral-700";
  };
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-200">
        <h2 className="font-semibold">Secrets</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="px-4 py-2 border-b border-neutral-100 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-neutral-500">Filter by:</span>
        
        <div className="relative">
          <select 
            className="text-sm pl-3 pr-8 py-1 rounded border border-neutral-200 appearance-none bg-white focus:outline-none focus:border-primary-500"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map((project: Project) => (
              <option key={project.id} value={project.id.toString()}>
                {project.name}
              </option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">▼</span>
        </div>
        
        <div className="relative">
          <select 
            className="text-sm pl-3 pr-8 py-1 rounded border border-neutral-200 appearance-none bg-white focus:outline-none focus:border-primary-500"
            value={secretType}
            onChange={(e) => setSecretType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="api">API Keys</option>
            <option value="credentials">Credentials</option>
            <option value="configurations">Configurations</option>
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">▼</span>
        </div>
        
        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Sort by:</span>
            <div className="relative">
              <select 
                className="text-sm pl-3 pr-8 py-1 rounded border border-neutral-200 appearance-none bg-white focus:outline-none focus:border-primary-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="lastModified">Last Modified</option>
                <option value="name">Name</option>
                <option value="project">Project</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">▼</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secrets Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-neutral-600">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Value</th>
              <th className="px-4 py-3 text-left font-medium">Project</th>
              <th className="px-4 py-3 text-left font-medium">Last Modified</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {secretsLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
                    <p className="text-neutral-500">Loading secrets...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedSecrets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <p className="text-neutral-500">No secrets found.</p>
                  <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>
                    Add your first secret
                  </Button>
                </td>
              </tr>
            ) : (
              paginatedSecrets.map((secret: Secret) => (
                <tr key={secret.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Key className="h-4 w-4 text-primary-500 mr-2" />
                      <span className="font-medium">{secret.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <code className="bg-neutral-100 px-2 py-1 rounded text-neutral-500 font-mono">
                        {visibleValues[secret.id] ? secret.value : '••••••••••••••••'}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(secret.value)}
                        className="ml-2 text-neutral-400 hover:text-neutral-700 p-1"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleSecretVisibility(secret.id)}
                        className="ml-1 text-neutral-400 hover:text-neutral-700 p-1"
                        title={visibleValues[secret.id] ? "Hide value" : "Show value"}
                      >
                        {visibleValues[secret.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProjectColorClasses(secret.projectId)}`}>
                      <Folder className="h-3 w-3 mr-1" /> {getProjectName(secret.projectId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">2 hours ago</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedSecret(secret);
                          setIsEditDialogOpen(true);
                        }}
                        className="text-neutral-400 hover:text-neutral-700 p-1"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedSecret(secret);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-neutral-400 hover:text-danger-500 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredSecrets.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
          <div className="flex items-center text-sm text-neutral-500">
            Showing <span className="font-medium mx-1">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium mx-1">
              {Math.min(page * ITEMS_PER_PAGE, filteredSecrets.length)}
            </span> of <span className="font-medium mx-1">{filteredSecrets.length}</span> results
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 ${page === i + 1 ? 'bg-primary-50 text-primary-600 font-medium' : 'text-neutral-600'}`}
              >
                {i + 1}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Create Secret Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Secret</DialogTitle>
          </DialogHeader>
          <SecretForm 
            projectId={projectId}
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/secrets'] });
              if (projectId) {
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/secrets`] });
              }
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Secret Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Secret</DialogTitle>
          </DialogHeader>
          {selectedSecret && (
            <SecretForm 
              secret={selectedSecret}
              projectId={selectedSecret.projectId}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/secrets'] });
                if (projectId) {
                  queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/secrets`] });
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the secret{" "}
              <span className="font-semibold">{selectedSecret?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedSecret && deleteMutation.mutate(selectedSecret.id)}
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper components for pagination
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Folder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
