import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { SSMClient, PutParameterCommand, GetParameterCommand, DeleteParameterCommand, GetParametersCommand } from "@aws-sdk/client-ssm";
import { 
  insertUserSchema, loginUserSchema, insertProjectSchema,
  insertSecretSchema, insertUserProjectSchema, insertActivityLogSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
const { Pool } = pg;

// Create PostgreSQL connection pool for session store
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PgStore = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure AWS SDK
  const awsRegion = process.env.AWS_REGION || "us-east-1";
  const ssmClient = new SSMClient({ region: awsRegion });

  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secrets-manager-secret",
      resave: false,
      saveUninitialized: false,
      store: new PgStore({
        pool: pgPool,
        tableName: 'session', // Use a table name that doesn't exist to create it
        createTableIfMissing: true
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false
      }
    })
  );

  // Configure passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to validate request body against zod schema
  const validateRequest = (schema: any) => (req: Request, res: Response, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  };

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && (req.user as any).role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Auth routes
  app.post("/api/auth/register", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        res.status(201).json({ user });
      });
    } catch (err: any) {
      if (err.code === '23505') { // Unique constraint violation
        res.status(400).json({ message: "Username or email already exists" });
      } else {
        res.status(500).json({ message: "Failed to register user" });
      }
    }
  });

  app.post(
    "/api/auth/login",
    validateRequest(loginUserSchema),
    passport.authenticate("local"),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, user: req.user });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // User routes
  app.post("/api/users", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      let projects;
      if (userRole === "admin") {
        projects = await storage.getProjects();
      } else {
        projects = await storage.getUserProjects(userId);
      }

      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, validateRequest(insertProjectSchema), async (req, res) => {
    try {
      const project = await storage.createProject(req.body);

      // Assign the creator as admin of the project
      const userId = (req.user as any).id;
      await storage.assignUserToProject({
        userId,
        projectId: project.id,
        role: "admin"
      });

      // Log activity
      await storage.logActivity({
        userId,
        action: "created",
        resourceType: "project",
        resourceId: project.id,
        details: `Created project: ${project.name}`
      });

      res.status(201).json(project);
    } catch (err) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Check if user has access to this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, projectId);
        if (!userProject) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      res.json(project);
    } catch (err) {
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  // Secret routes
  app.get("/api/secrets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      let secrets = [];
      if (userRole === "admin") {
        secrets = await storage.getSecrets();
      } else {
        const userProjects = await storage.getUserProjects(userId);
        for (const project of userProjects) {
          const projectSecrets = await storage.getProjectSecrets(project.id);
          secrets.push(...projectSecrets);
        }
      }

      res.json(secrets);
    } catch (err) {
      res.status(500).json({ message: "Failed to get secrets" });
    }
  });

  app.get("/api/projects/:id/secrets", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Check if user has access to this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, projectId);
        if (!userProject) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const secrets = await storage.getProjectSecrets(projectId);

      // Log activity 
      await storage.logActivity({
        userId,
        action: "viewed",
        resourceType: "project",
        resourceId: projectId,
        details: `Viewed secrets in project with ID: ${projectId}`
      });

      res.json(secrets);
    } catch (err) {
      res.status(500).json({ message: "Failed to get project secrets" });
    }
  });

  app.post("/api/secrets", isAuthenticated, validateRequest(insertSecretSchema), async (req, res) => {
    try {
      const projectId = req.body.projectId;
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Check if user has permission to add secrets to this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, projectId);
        if (!userProject || !["admin", "editor"].includes(userProject.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Get project to build SSM path
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Format SSM path
      const formattedProjectName = project.name.toLowerCase().replace(/ /g, "-");
      const ssmPath = `/secrets-manager/${formattedProjectName}/${req.body.name}`;

      // Store in AWS SSM Parameter Store
      try {
        console.log("Attempting to store in SSM:", {
          path: ssmPath,
          type: req.body.isEncrypted ? "SecureString" : "String"
        });
        
        await ssmClient.send(new PutParameterCommand({
          Name: ssmPath,
          Value: req.body.value,
          Type: req.body.isEncrypted ? "SecureString" : "String",
          Overwrite: true
        }));
        
        console.log("Successfully stored in SSM");
      } catch (error: any) {
        console.error("Error storing in SSM:", error);
        return res.status(500).json({ message: "Failed to store secret in AWS SSM", error: error.message });
      }

      // Store in our database
      const secret = await storage.createSecret({
        ...req.body,
        ssmPath
      });

      // Log activity
      await storage.logActivity({
        userId,
        action: "created",
        resourceType: "secret",
        resourceId: secret.id,
        details: `Created secret: ${secret.name} in project: ${project.name}`
      });

      res.status(201).json(secret);
    } catch (err) {
      res.status(500).json({ message: "Failed to create secret" });
    }
  });

  app.put("/api/secrets/:id", isAuthenticated, async (req, res) => {
    try {
      const secretId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Get the secret
      const secret = await storage.getSecret(secretId);
      if (!secret) {
        return res.status(404).json({ message: "Secret not found" });
      }

      // Check if user has permission to update secrets in this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, secret.projectId);
        if (!userProject || !["admin", "editor"].includes(userProject.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Update in AWS SSM if value changed
      if (req.body.value && req.body.value !== secret.value) {
        try {
          await ssmClient.send(new PutParameterCommand({
            Name: secret.ssmPath,
            Value: req.body.value,
            Type: req.body.isEncrypted ? "SecureString" : "String",
            Overwrite: true
          }));
        } catch (error: any) {
          console.error("Error updating in SSM:", error);
          return res.status(500).json({ message: "Failed to update secret in AWS SSM", error: error.message });
        }
      }

      // Update in our database
      const updatedSecret = await storage.updateSecret(secretId, req.body);

      // Log activity
      await storage.logActivity({
        userId,
        action: "updated",
        resourceType: "secret",
        resourceId: secretId,
        details: `Updated secret: ${secret.name}`
      });

      res.json(updatedSecret);
    } catch (err) {
      res.status(500).json({ message: "Failed to update secret" });
    }
  });

  app.delete("/api/secrets/:id", isAuthenticated, async (req, res) => {
    try {
      const secretId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Get the secret
      const secret = await storage.getSecret(secretId);
      if (!secret) {
        return res.status(404).json({ message: "Secret not found" });
      }

      // Check if user has permission to delete secrets in this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, secret.projectId);
        if (!userProject || !["admin"].includes(userProject.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Delete from AWS SSM
      try {
        await ssmClient.send(new DeleteParameterCommand({
          Name: secret.ssmPath
        }));
      } catch (error: any) {
        console.error("Error deleting from SSM:", error);
        return res.status(500).json({ message: "Failed to delete secret from AWS SSM", error: error.message });
      }

      // Delete from our database
      await storage.deleteSecret(secretId);

      // Log activity
      await storage.logActivity({
        userId,
        action: "deleted",
        resourceType: "secret",
        resourceId: secretId,
        details: `Deleted secret: ${secret.name}`
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete secret" });
    }
  });

  // User Project routes
  app.post("/api/user-projects", isAuthenticated, validateRequest(insertUserProjectSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      const projectId = req.body.projectId;

      // Check if user has permission to manage users in this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, projectId);
        if (!userProject || !["admin"].includes(userProject.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const userProject = await storage.assignUserToProject(req.body);

      // Log activity
      const targetUser = await storage.getUser(req.body.userId);
      const project = await storage.getProject(projectId);

      await storage.logActivity({
        userId,
        action: "assigned",
        resourceType: "project",
        resourceId: projectId,
        details: `Assigned user: ${targetUser?.username} to project: ${project?.name} with role: ${req.body.role}`
      });

      res.status(201).json(userProject);
    } catch (err) {
      res.status(500).json({ message: "Failed to assign user to project" });
    }
  });

  app.get("/api/projects/:id/users", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Check if user has access to this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, projectId);
        if (!userProject) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const userProjects = await storage.getProjectUsers(projectId);

      // Get full user details for each user-project relation
      const users = await Promise.all(userProjects.map(async (up) => {
        const user = await storage.getUser(up.userId);
        return {
          ...up,
          user
        };
      }));

      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to get project users" });
    }
  });

  // Activity log routes
  app.get("/api/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      let logs;
      if (userRole === "admin") {
        logs = await storage.getActivityLogs();
      } else {
        logs = await storage.getUserActivityLogs(userId);
      }

      // Enrich logs with user and project/secret information
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const user = await storage.getUser(log.userId);

        let resource;
        if (log.resourceType === "project") {
          resource = await storage.getProject(log.resourceId);
        } else if (log.resourceType === "secret") {
          resource = await storage.getSecret(log.resourceId);
        }

        return {
          ...log,
          user: user ? { id: user.id, username: user.username } : undefined,
          resource
        };
      }));

      res.json(enrichedLogs);
    } catch (err) {
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  });

  app.get("/api/projects/:id/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Check if user has access to this project
      if (userRole !== "admin") {
        const userProject = await storage.getUserProject(userId, projectId);
        if (!userProject) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const logs = await storage.getProjectActivityLogs(projectId);

      // Enrich logs with user information
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const user = await storage.getUser(log.userId);

        let resource;
        if (log.resourceType === "project") {
          resource = await storage.getProject(log.resourceId);
        } else if (log.resourceType === "secret") {
          resource = await storage.getSecret(log.resourceId);
        }

        return {
          ...log,
          user: user ? { id: user.id, username: user.username } : undefined,
          resource
        };
      }));

      res.json(enrichedLogs);
    } catch (err) {
      res.status(500).json({ message: "Failed to get project activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}