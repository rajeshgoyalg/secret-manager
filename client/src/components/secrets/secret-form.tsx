import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Secret, insertSecretSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface SecretFormProps {
  secret?: Secret;
  projectId?: number;
  onSuccess?: () => void;
}

export function SecretForm({ secret, projectId, onSuccess }: SecretFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  // Get projects list for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects']
  });
  
  // Extended schema with validation
  const formSchema = insertSecretSchema.extend({
    name: z.string().min(1, "Name is required").regex(/^[A-Z0-9_]+$/, "Name must be uppercase with underscores only"),
    value: z.string().min(1, "Value is required"),
  });
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: secret?.name || "",
      value: secret?.value || "",
      description: secret?.description || "",
      projectId: secret?.projectId || projectId || 0,
      ssmPath: secret?.ssmPath || "",
      isEncrypted: secret?.isEncrypted || false
    }
  });
  
  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (secret) {
        return apiRequest("PUT", `/api/secrets/${secret.id}`, values);
      } else {
        return apiRequest("POST", "/api/secrets", values);
      }
    },
    onSuccess: () => {
      toast({
        title: secret ? "Secret updated" : "Secret created",
        description: secret 
          ? "The secret has been updated successfully." 
          : "The secret has been created successfully.",
      });
      
      // Reset form if creating new secret
      if (!secret) {
        form.reset({
          name: "",
          value: "",
          description: "",
          projectId: projectId || 0,
          ssmPath: "",
          isEncrypted: false
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Secret operation failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${secret ? "update" : "create"} secret. Please try again.`,
      });
    }
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., API_KEY_PRODUCTION" {...field} />
              </FormControl>
              <p className="text-xs text-neutral-500">Use uppercase and underscores for consistency</p>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret Value</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter secret value"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add details about this secret..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isEncrypted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Encrypt with additional layer of security</FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {secret ? "Updating..." : "Creating..."}
              </>
            ) : (
              secret ? "Update Secret" : "Create Secret"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
