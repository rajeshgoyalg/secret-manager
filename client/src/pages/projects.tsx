import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Folder, Pencil, Trash, Users, File } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";

export default function Projects() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/projects", {
        name: newProjectName,
        description: newProjectDescription
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      toast({
        title: "Project created",
        description: "The project has been successfully created.",
      });
    },
    onError: (error) => {
      console.error("Failed to create project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the project. Please try again.",
      });
    }
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject) return;
      return apiRequest("PUT", `/api/projects/${currentProject.id}`, {
        name: newProjectName,
        description: newProjectDescription
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsEditDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setCurrentProject(null);
      toast({
        title: "Project updated",
        description: "The project has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the project. Please try again.",
      });
    }
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject) return;
      return apiRequest("DELETE", `/api/projects/${currentProject.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsDeleteDialogOpen(false);
      setCurrentProject(null);
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the project. Please try again.",
      });
    }
  });
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Project name is required.",
      });
      return;
    }
    
    createProjectMutation.mutate();
  };
  
  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Project name is required.",
      });
      return;
    }
    
    updateProjectMutation.mutate();
  };
  
  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };
  
  const openEditDialog = (project: Project) => {
    setCurrentProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || "");
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (project: Project) => {
    setCurrentProject(project);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Projects" onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">Projects</h1>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Project
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-neutral-700">No projects found</h2>
              <p className="text-neutral-500 mb-4">Create your first project to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (Optional)</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe what this project is for"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input
                  id="edit-project-name"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-description">Description (Optional)</Label>
                <Textarea
                  id="edit-project-description"
                  placeholder="Describe what this project is for"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Updating...
                  </>
                ) : (
                  "Update Project"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-neutral-700 mb-4">
              Are you sure you want to delete the project <strong>{currentProject?.name}</strong>? 
              This action cannot be undone and will delete all associated secrets.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Deleting...
                  </>
                ) : (
                  "Delete Project"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  // Fetch project secrets count
  const { data: projectSecrets = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${project.id}/secrets`],
  });
  
  // Fetch project users/members
  const { data: projectUsers = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${project.id}/users`],
  });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <CardDescription>
          {project.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
          <div className="flex items-center">
            <File className="h-4 w-4 mr-1" /> {projectSecrets.length || 0} secrets
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" /> {projectUsers.length || 0} members
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(project)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-500 hover:text-red-500 hover:border-red-200"
          onClick={() => onDelete(project)}
        >
          <Trash className="h-3.5 w-3.5 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
