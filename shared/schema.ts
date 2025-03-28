import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // admin, user
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
});

// User Project Roles
export const userProjects = pgTable("user_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  role: text("role").notNull().default("viewer"), // admin, editor, viewer
});

export const insertUserProjectSchema = createInsertSchema(userProjects).pick({
  userId: true,
  projectId: true,
  role: true,
});

// Secrets
export const secrets = pgTable("secrets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  ssmPath: text("ssm_path").notNull(),
  isEncrypted: boolean("is_encrypted").default(false),
});

export const insertSecretSchema = createInsertSchema(secrets).pick({
  name: true,
  value: true,
  description: true,
  projectId: true,
  ssmPath: true,
  isEncrypted: true,
});

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // created, updated, deleted, viewed
  resourceType: text("resource_type").notNull(), // secret, project, user
  resourceId: integer("resource_id").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  details: true,
});

// Define Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type UserProject = typeof userProjects.$inferSelect;
export type InsertUserProject = z.infer<typeof insertUserProjectSchema>;

export type Secret = typeof secrets.$inferSelect;
export type InsertSecret = z.infer<typeof insertSecretSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Extended schemas for validation
export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;
