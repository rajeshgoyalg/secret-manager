import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project, User, UserProject } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, ShieldAlert, ShieldOff, ShieldCheck, XCircle, User as UserIcon, Folder, PlusCircle } from "lucide-react";

export default function Permissions() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();

  // Define form schema
  const formSchema = z.object({
    userId: z.string().min(1, "Please select a user"),
    projectId: z.string().min(1, "Please select a project"),
    role: z.string().min(1, "Please select a role"),
  });

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: projectUsers = [], isLoading: projectUsersLoading } = useQuery({
    queryKey: selectedProject ? [`/api/projects/${selectedProject}/users`] : null,
    enabled: !!selectedProject,
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      projectId: selectedProject || "",
      role: "viewer",
    },
  });

  // Update projectId when selectedProject changes
  useState(() => {
    if (selectedProject) {
      form.setValue("projectId", selectedProject);
    }
  });

  // Assign user to project mutation
  const assignUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/user-projects", {
        userId: parseInt(values.userId),
        projectId: parseInt(values.projectId),
        role: values.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/users`] });
      setIsAddUserDialogOpen(false);
      toast({
        title: "User assigned",
        description: "The user has been successfully assigned to the project.",
      });
      form.reset();
    },
    onError: (error) => {
      console.error("Failed to assign user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign user to project. Please try again.",
      });
    }
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, projectId, role }: { userId: number, projectId: number, role: string }) => {
      return apiRequest("PUT", `/api/user-projects`, {
        userId,
        projectId,
        role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/users`] });
      toast({
        title: "Role updated",
        description: "The user's role has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role. Please try again.",
      });
    }
  });

  // Remove user from project mutation
  const removeUserMutation = useMutation({
    mutationFn: async ({ userId, projectId }: { userId: number, projectId: number }) => {
      return apiRequest("DELETE", `/api/user-projects/${userId}/${projectId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/users`] });
      toast({
        title: "User removed",
        description: "The user has been successfully removed from the project.",
      });
    },
    onError: (error) => {
      console.error("Failed to remove user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove user from project. Please try again.",
      });
    }
  });

  // Form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    assignUserMutation.mutate(values);
  };

  // Get role badge classes
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary-50 text-primary-700';
      case 'editor':
        return 'bg-warning-500/10 text-warning-700';
      case 'viewer':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3.5 w-3.5 mr-1" />;
      case 'editor':
        return <ShieldAlert className="h-3.5 w-3.5 mr-1" />;
      case 'viewer':
        return <ShieldOff className="h-3.5 w-3.5 mr-1" />;
      default:
        return <ShieldOff className="h-3.5 w-3.5 mr-1" />;
    }
  };

  // Handle role change
  const handleRoleChange = (userId: number, projectId: number, newRole: string) => {
    updateRoleMutation.mutate({ userId, projectId, role: newRole });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Permissions" onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">Project Permissions</h1>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Project Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-full md:w-72">
                    <Select
                      value={selectedProject}
                      onValueChange={setSelectedProject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectsLoading ? (
                          <div className="py-2 px-4 text-center">Loading projects...</div>
                        ) : projects.length === 0 ? (
                          <div className="py-2 px-4 text-center">No projects found</div>
                        ) : (
                          projects.map((project: Project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedProject && (
                    <Button onClick={() => setIsAddUserDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Add User to Project
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* User Permissions Table */}
            {selectedProject && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Project Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectUsersLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : projectUsers.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <UserIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                      <p className="mb-2">No users assigned to this project</p>
                      <Button onClick={() => setIsAddUserDialogOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Add User
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectUsers.map((userProject: UserProject & { user?: User }) => (
                            <TableRow key={`${userProject.userId}-${userProject.projectId}`}>
                              <TableCell className="font-medium">
                                {userProject.user?.fullName}
                              </TableCell>
                              <TableCell>
                                {userProject.user?.email}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Select
                                    defaultValue={userProject.role}
                                    onValueChange={(value) => 
                                      handleRoleChange(userProject.userId, userProject.projectId, value)
                                    }
                                  >
                                    <SelectTrigger className={`w-32 h-8 text-xs ${getRoleBadgeClass(userProject.role)}`}>
                                      <SelectValue>
                                        <div className="flex items-center">
                                          {getRoleIcon(userProject.role)}
                                          {userProject.role}
                                        </div>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">
                                        <div className="flex items-center">
                                          <ShieldCheck className="h-4 w-4 mr-2 text-primary-500" />
                                          Admin
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="editor">
                                        <div className="flex items-center">
                                          <ShieldAlert className="h-4 w-4 mr-2 text-warning-500" />
                                          Editor
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="viewer">
                                        <div className="flex items-center">
                                          <ShieldOff className="h-4 w-4 mr-2 text-neutral-500" />
                                          Viewer
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-neutral-400 hover:text-danger-500 h-8 w-8 p-0"
                                  onClick={() => removeUserMutation.mutate({
                                    userId: userProject.userId,
                                    projectId: userProject.projectId
                                  })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      
      {/* Add User to Project Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User to Project</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usersLoading ? (
                          <div className="py-2 px-4 text-center">Loading users...</div>
                        ) : users.length === 0 ? (
                          <div className="py-2 px-4 text-center">No users found</div>
                        ) : (
                          users.map((user: User) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName} ({user.username})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-2 text-primary-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center">
                            <ShieldAlert className="h-4 w-4 mr-2 text-warning-500" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center">
                            <ShieldOff className="h-4 w-4 mr-2 text-neutral-500" />
                            Viewer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignUserMutation.isPending}>
                  {assignUserMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Adding...
                    </>
                  ) : (
                    "Add User"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
