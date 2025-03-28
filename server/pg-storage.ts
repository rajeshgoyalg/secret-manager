import { 
  User, InsertUser, 
  Project, InsertProject, 
  Secret, InsertSecret, 
  UserProject, InsertUserProject, 
  ActivityLog, InsertActivityLog, 
  users, projects, secrets, userProjects, activityLogs
} from '../shared/schema';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import { IStorage } from './storage';

/**
 * PostgreSQL Storage implementation using Drizzle ORM
 */
export class PgStorage implements IStorage {
  /**
   * User methods
   */
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  /**
   * Project methods
   */
  async getProject(id: number): Promise<Project | undefined> {
    const results = await db.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    const userProjectsData = await db
      .select()
      .from(userProjects)
      .where(eq(userProjects.userId, userId));
    
    const projectIds = userProjectsData.map(up => up.projectId);
    
    if (projectIds.length === 0) {
      return [];
    }
    
    if (projectIds.length === 1) {
      // For a single project ID, use simple equality
      return db
        .select()
        .from(projects)
        .where(eq(projects.id, projectIds[0]));
    } else {
      // For multiple project IDs, construct a filter for each ID and OR them together
      const conditions = projectIds.map(id => eq(projects.id, id));
      const result = await db.select().from(projects);
      return result.filter(project => projectIds.includes(project.id));
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const results = await db.insert(projects).values(project).returning();
    return results[0];
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const results = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    
    return results[0];
  }

  async deleteProject(id: number): Promise<boolean> {
    const results = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    
    return results.length > 0;
  }

  /**
   * Secret methods
   */
  async getSecret(id: number): Promise<Secret | undefined> {
    const results = await db.select().from(secrets).where(eq(secrets.id, id));
    return results[0];
  }

  async getSecrets(): Promise<Secret[]> {
    return db.select().from(secrets);
  }

  async getProjectSecrets(projectId: number): Promise<Secret[]> {
    return db
      .select()
      .from(secrets)
      .where(eq(secrets.projectId, projectId));
  }

  async createSecret(secret: InsertSecret): Promise<Secret> {
    const results = await db.insert(secrets).values(secret).returning();
    return results[0];
  }

  async updateSecret(id: number, secret: Partial<InsertSecret>): Promise<Secret | undefined> {
    const results = await db
      .update(secrets)
      .set(secret)
      .where(eq(secrets.id, id))
      .returning();
    
    return results[0];
  }

  async deleteSecret(id: number): Promise<boolean> {
    const results = await db
      .delete(secrets)
      .where(eq(secrets.id, id))
      .returning({ id: secrets.id });
    
    return results.length > 0;
  }

  /**
   * User Project Role methods
   */
  async getUserProject(userId: number, projectId: number): Promise<UserProject | undefined> {
    const results = await db
      .select()
      .from(userProjects)
      .where(
        and(
          eq(userProjects.userId, userId),
          eq(userProjects.projectId, projectId)
        )
      );
    
    return results[0];
  }

  async assignUserToProject(userProject: InsertUserProject): Promise<UserProject> {
    const results = await db.insert(userProjects).values(userProject).returning();
    return results[0];
  }

  async updateUserProjectRole(userId: number, projectId: number, role: string): Promise<UserProject | undefined> {
    const results = await db
      .update(userProjects)
      .set({ role })
      .where(
        and(
          eq(userProjects.userId, userId),
          eq(userProjects.projectId, projectId)
        )
      )
      .returning();
    
    return results[0];
  }

  async removeUserFromProject(userId: number, projectId: number): Promise<boolean> {
    const results = await db
      .delete(userProjects)
      .where(
        and(
          eq(userProjects.userId, userId),
          eq(userProjects.projectId, projectId)
        )
      )
      .returning({ id: userProjects.id });
    
    return results.length > 0;
  }

  async getProjectUsers(projectId: number): Promise<UserProject[]> {
    const userProjectEntries = await db
      .select()
      .from(userProjects)
      .where(eq(userProjects.projectId, projectId));
    
    // Enrich with user data
    const enrichedEntries = await Promise.all(
      userProjectEntries.map(async (entry) => {
        const user = await this.getUser(entry.userId);
        return { ...entry, user };
      })
    );
    
    return enrichedEntries;
  }

  /**
   * Activity Log methods
   */
  async getActivityLogs(): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp));
  }

  async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async getProjectActivityLogs(projectId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.resourceType, 'project'),
          eq(activityLogs.resourceId, projectId)
        )
      )
      .orderBy(desc(activityLogs.timestamp));
  }

  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const activityWithTimestamp = {
      ...activity,
      timestamp: new Date(),
    };
    
    const results = await db
      .insert(activityLogs)
      .values(activityWithTimestamp)
      .returning();
    
    return results[0];
  }
}