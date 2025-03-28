import { 
  User, InsertUser, Project, InsertProject, Secret, InsertSecret, 
  ActivityLog, InsertActivityLog, UserProject, InsertUserProject,
  users, projects, secrets, activityLogs, userProjects
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Secret methods
  getSecret(id: number): Promise<Secret | undefined>;
  getSecrets(): Promise<Secret[]>;
  getProjectSecrets(projectId: number): Promise<Secret[]>;
  createSecret(secret: InsertSecret): Promise<Secret>;
  updateSecret(id: number, secret: Partial<InsertSecret>): Promise<Secret | undefined>;
  deleteSecret(id: number): Promise<boolean>;
  
  // User Project Role methods
  getUserProject(userId: number, projectId: number): Promise<UserProject | undefined>;
  assignUserToProject(userProject: InsertUserProject): Promise<UserProject>;
  updateUserProjectRole(userId: number, projectId: number, role: string): Promise<UserProject | undefined>;
  removeUserFromProject(userId: number, projectId: number): Promise<boolean>;
  getProjectUsers(projectId: number): Promise<UserProject[]>;
  
  // Activity Log methods
  getActivityLogs(): Promise<ActivityLog[]>;
  getUserActivityLogs(userId: number): Promise<ActivityLog[]>;
  getProjectActivityLogs(projectId: number): Promise<ActivityLog[]>;
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private secrets: Map<number, Secret>;
  private activityLogs: Map<number, ActivityLog>;
  private userProjects: Map<number, UserProject>;
  
  private currentUserId: number;
  private currentProjectId: number;
  private currentSecretId: number;
  private currentActivityLogId: number;
  private currentUserProjectId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.secrets = new Map();
    this.activityLogs = new Map();
    this.userProjects = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentSecretId = 1;
    this.currentActivityLogId = 1;
    this.currentUserProjectId = 1;
    
    // Add admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin"
    };
    this.users.set(adminUser.id, adminUser);
    
    // Add some sample projects
    const projects = [
      { name: "Frontend API", description: "Frontend API keys and configuration" },
      { name: "Auth Service", description: "Authentication service configuration" },
      { name: "Payment Portal", description: "Payment processing configuration" },
      { name: "Database Credentials", description: "Database access credentials" }
    ];
    
    projects.forEach(p => {
      const project: Project = {
        id: this.currentProjectId++,
        ...p
      };
      this.projects.set(project.id, project);
      
      // Assign admin to all projects
      this.userProjects.set(this.currentUserProjectId, {
        id: this.currentUserProjectId++,
        userId: adminUser.id,
        projectId: project.id,
        role: "admin"
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getUserProjects(userId: number): Promise<Project[]> {
    const userProjectEntries = Array.from(this.userProjects.values())
      .filter(up => up.userId === userId);
    
    const projectIds = userProjectEntries.map(up => up.projectId);
    
    return Array.from(this.projects.values())
      .filter(project => projectIds.includes(project.id));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;

    const updatedProject: Project = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Secret methods
  async getSecret(id: number): Promise<Secret | undefined> {
    return this.secrets.get(id);
  }

  async getSecrets(): Promise<Secret[]> {
    return Array.from(this.secrets.values());
  }

  async getProjectSecrets(projectId: number): Promise<Secret[]> {
    return Array.from(this.secrets.values())
      .filter(secret => secret.projectId === projectId);
  }

  async createSecret(secret: InsertSecret): Promise<Secret> {
    const id = this.currentSecretId++;
    const newSecret: Secret = { ...secret, id };
    this.secrets.set(id, newSecret);
    return newSecret;
  }

  async updateSecret(id: number, secret: Partial<InsertSecret>): Promise<Secret | undefined> {
    const existingSecret = this.secrets.get(id);
    if (!existingSecret) return undefined;

    const updatedSecret: Secret = { ...existingSecret, ...secret };
    this.secrets.set(id, updatedSecret);
    return updatedSecret;
  }

  async deleteSecret(id: number): Promise<boolean> {
    return this.secrets.delete(id);
  }

  // User Project Role methods
  async getUserProject(userId: number, projectId: number): Promise<UserProject | undefined> {
    return Array.from(this.userProjects.values())
      .find(up => up.userId === userId && up.projectId === projectId);
  }

  async assignUserToProject(userProject: InsertUserProject): Promise<UserProject> {
    // Check if relationship already exists
    const existing = await this.getUserProject(userProject.userId, userProject.projectId);
    if (existing) {
      // Update role if it exists
      return this.updateUserProjectRole(userProject.userId, userProject.projectId, userProject.role) as Promise<UserProject>;
    }
    
    const id = this.currentUserProjectId++;
    const newUserProject: UserProject = { ...userProject, id };
    this.userProjects.set(id, newUserProject);
    return newUserProject;
  }

  async updateUserProjectRole(userId: number, projectId: number, role: string): Promise<UserProject | undefined> {
    const userProject = await this.getUserProject(userId, projectId);
    if (!userProject) return undefined;

    const updatedUserProject: UserProject = { ...userProject, role };
    this.userProjects.set(userProject.id, updatedUserProject);
    return updatedUserProject;
  }

  async removeUserFromProject(userId: number, projectId: number): Promise<boolean> {
    const userProject = await this.getUserProject(userId, projectId);
    if (!userProject) return false;

    return this.userProjects.delete(userProject.id);
  }
  
  async getProjectUsers(projectId: number): Promise<UserProject[]> {
    return Array.from(this.userProjects.values())
      .filter(up => up.projectId === projectId);
  }

  // Activity Log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getProjectActivityLogs(projectId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => (log.resourceType === 'project' && log.resourceId === projectId) || 
              (log.resourceType === 'secret' && 
                Array.from(this.secrets.values())
                  .filter(s => s.projectId === projectId)
                  .map(s => s.id)
                  .includes(log.resourceId)))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const timestamp = new Date();
    const newActivity: ActivityLog = { ...activity, id, timestamp };
    this.activityLogs.set(id, newActivity);
    return newActivity;
  }
}

// Import the PostgreSQL storage implementation
import { PgStorage } from './pg-storage';

// Use PostgreSQL storage instead of in-memory storage
export const storage = new PgStorage();
