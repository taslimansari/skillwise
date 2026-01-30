import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { generateCareerRecommendations, generateRoadmap, extractSkillsFromText } from "./ai";
import { seedDatabase } from "./seed";
import {
  loginSchema,
  registerSchema,
  insertSkillSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as pdfParse from "pdf-parse";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "skillwise-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  await seedDatabase();

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.session.userId!, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/skills", requireAuth, async (req, res) => {
    try {
      const skills = await storage.getSkills(req.session.userId!);
      res.json(skills);
    } catch (error) {
      console.error("Get skills error:", error);
      res.status(500).json({ message: "Failed to get skills" });
    }
  });

  app.post("/api/skills", requireAuth, async (req, res) => {
    try {
      const data = insertSkillSchema.omit({ userId: true }).parse(req.body);
      const skill = await storage.createSkill({
        ...data,
        userId: req.session.userId!,
      });
      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create skill error:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.delete("/api/skills/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const skill = await storage.getSkill(id);
      if (!skill || skill.userId !== req.session.userId) {
        return res.status(404).json({ message: "Skill not found" });
      }
      await storage.deleteSkill(id);
      res.json({ message: "Skill deleted" });
    } catch (error) {
      console.error("Delete skill error:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  app.post("/api/skills/extract", requireAuth, upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse PDF
      let text: string;
      try {
        const pdf = (pdfParse as any).default || pdfParse;
        const pdfData = await pdf(req.file.buffer);
        text = pdfData.text;
        
        if (!text || text.trim().length < 50) {
          return res.status(400).json({ 
            message: "Could not extract text from PDF. Please ensure the PDF contains readable text (not scanned images)." 
          });
        }
      } catch (pdfError: any) {
        console.error("PDF parsing error:", pdfError);
        return res.status(400).json({ 
          message: "Could not read PDF file. Please ensure it's a valid PDF document." 
        });
      }

      // Extract skills using AI
      const extractedSkills = await extractSkillsFromText(text);
      
      if (extractedSkills.length === 0) {
        return res.status(400).json({ 
          message: "No skills could be identified from your resume. Please try adding skills manually." 
        });
      }

      const skillsToCreate = extractedSkills.map((skill) => ({
        userId: req.session.userId!,
        name: skill.name,
        category: skill.category as "technical" | "tools" | "soft",
        proficiency: skill.proficiency as "beginner" | "intermediate" | "advanced" | "expert",
      }));

      const createdSkills = await storage.createManySkills(skillsToCreate);

      await storage.createResume({
        userId: req.session.userId!,
        filename: req.file.originalname,
        extractedSkills: extractedSkills,
      });

      res.json({ extractedCount: createdSkills.length, skills: createdSkills });
    } catch (error: any) {
      console.error("Extract skills error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to extract skills from resume. Please try again." 
      });
    }
  });

  app.get("/api/career-paths", requireAuth, async (req, res) => {
    try {
      const careerPaths = await storage.getCareerPaths(req.session.userId!);
      res.json(careerPaths);
    } catch (error) {
      console.error("Get career paths error:", error);
      res.status(500).json({ message: "Failed to get career paths" });
    }
  });

  app.post("/api/career-paths/generate", requireAuth, async (req, res) => {
    try {
      const skills = await storage.getSkills(req.session.userId!);
      if (skills.length === 0) {
        return res.status(400).json({ message: "Please add skills first" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteAllCareerPathsForUser(req.session.userId!);

      const recommendations = await generateCareerRecommendations(skills, user);

      const careerPathsToCreate = recommendations.map((rec) => ({
        userId: req.session.userId!,
        title: rec.title,
        description: rec.description,
        matchPercentage: rec.matchPercentage,
        matchReasons: rec.matchReasons,
        requiredSkills: rec.requiredSkills,
        salaryRange: rec.salaryRange,
        demandLevel: rec.demandLevel,
        isSelected: false,
      }));

      const createdPaths = await storage.createManyCareerPaths(careerPathsToCreate);
      res.json(createdPaths);
    } catch (error) {
      console.error("Generate career paths error:", error);
      res.status(500).json({ message: "Failed to generate career recommendations" });
    }
  });

  app.post("/api/career-paths/:id/select", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const careerPath = await storage.getCareerPath(id);
      
      if (!careerPath || careerPath.userId !== req.session.userId) {
        return res.status(404).json({ message: "Career path not found" });
      }

      await storage.selectCareerPath(req.session.userId!, id);

      const skills = await storage.getSkills(req.session.userId!);
      const roadmapData = await generateRoadmap(careerPath, skills);

      await storage.deleteRoadmapsForUser(req.session.userId!);

      const roadmap = await storage.createRoadmap({
        userId: req.session.userId!,
        careerPathId: id,
        title: roadmapData.title,
        description: roadmapData.description,
      });

      const stepsToCreate = roadmapData.steps.map((step, index) => ({
        roadmapId: roadmap.id,
        phase: step.phase,
        title: step.title,
        description: step.description,
        skills: step.skills,
        duration: step.duration,
        orderIndex: index,
        isCompleted: false,
      }));

      await storage.createManyRoadmapSteps(stepsToCreate);

      res.json({ message: "Career path selected and roadmap generated" });
    } catch (error) {
      console.error("Select career path error:", error);
      res.status(500).json({ message: "Failed to select career path" });
    }
  });

  app.get("/api/roadmaps/current", requireAuth, async (req, res) => {
    try {
      const roadmap = await storage.getRoadmap(req.session.userId!);
      res.json(roadmap || null);
    } catch (error) {
      console.error("Get roadmap error:", error);
      res.status(500).json({ message: "Failed to get roadmap" });
    }
  });

  app.patch("/api/roadmap-steps/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const step = await storage.updateRoadmapStep(id, req.body);
      if (!step) {
        return res.status(404).json({ message: "Step not found" });
      }
      res.json(step);
    } catch (error) {
      console.error("Update roadmap step error:", error);
      res.status(500).json({ message: "Failed to update step" });
    }
  });

  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  app.get("/api/saved-courses", requireAuth, async (req, res) => {
    try {
      const savedCourses = await storage.getSavedCourses(req.session.userId!);
      res.json(savedCourses);
    } catch (error) {
      console.error("Get saved courses error:", error);
      res.status(500).json({ message: "Failed to get saved courses" });
    }
  });

  app.post("/api/saved-courses", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.body;
      const savedCourse = await storage.createSavedCourse({
        userId: req.session.userId!,
        courseId,
      });
      res.json(savedCourse);
    } catch (error) {
      console.error("Save course error:", error);
      res.status(500).json({ message: "Failed to save course" });
    }
  });

  app.delete("/api/saved-courses/:courseId", requireAuth, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      await storage.deleteSavedCourse(req.session.userId!, courseId);
      res.json({ message: "Course removed from saved" });
    } catch (error) {
      console.error("Delete saved course error:", error);
      res.status(500).json({ message: "Failed to remove course" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  app.get("/api/saved-projects", requireAuth, async (req, res) => {
    try {
      const savedProjects = await storage.getSavedProjects(req.session.userId!);
      res.json(savedProjects);
    } catch (error) {
      console.error("Get saved projects error:", error);
      res.status(500).json({ message: "Failed to get saved projects" });
    }
  });

  app.post("/api/saved-projects", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.body;
      const savedProject = await storage.createSavedProject({
        userId: req.session.userId!,
        projectId,
        isCompleted: false,
      });
      res.json(savedProject);
    } catch (error) {
      console.error("Save project error:", error);
      res.status(500).json({ message: "Failed to save project" });
    }
  });

  app.patch("/api/saved-projects/:projectId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const savedProject = await storage.updateSavedProject(
        req.session.userId!,
        projectId,
        req.body
      );
      if (!savedProject) {
        return res.status(404).json({ message: "Saved project not found" });
      }
      res.json(savedProject);
    } catch (error) {
      console.error("Update saved project error:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/saved-projects/:projectId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      await storage.deleteSavedProject(req.session.userId!, projectId);
      res.json({ message: "Project removed from saved" });
    } catch (error) {
      console.error("Delete saved project error:", error);
      res.status(500).json({ message: "Failed to remove project" });
    }
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const [skills, careerPaths, savedCourses, savedProjects] = await Promise.all([
        storage.getSkills(userId),
        storage.getCareerPaths(userId),
        storage.getSavedCourses(userId),
        storage.getSavedProjects(userId),
      ]);

      const roadmap = await storage.getRoadmap(userId);
      const roadmapSteps = roadmap?.steps || [];
      const completedSteps = roadmapSteps.filter((s) => s.isCompleted).length;

      res.json({
        skills,
        careerPaths,
        roadmapSteps,
        savedCourses,
        savedProjects,
        completedSteps,
        totalSteps: roadmapSteps.length,
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  return httpServer;
}
