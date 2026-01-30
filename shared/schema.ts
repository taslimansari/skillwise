import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  education: text("education"),
  currentRole: text("current_role"),
  experienceLevel: text("experience_level"),
  interests: text("interests").array(),
  careerGoals: text("career_goals").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  proficiency: text("proficiency").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const careerPaths = pgTable("career_paths", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  matchPercentage: integer("match_percentage").notNull(),
  matchReasons: text("match_reasons").array().notNull(),
  requiredSkills: text("required_skills").array().notNull(),
  salaryRange: text("salary_range"),
  demandLevel: text("demand_level"),
  isSelected: boolean("is_selected").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const roadmaps = pgTable("roadmaps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  careerPathId: integer("career_path_id").references(() => careerPaths.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const roadmapSteps = pgTable("roadmap_steps", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  phase: text("phase").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array().notNull(),
  duration: text("duration"),
  orderIndex: integer("order_index").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  instructor: text("instructor"),
  duration: text("duration"),
  level: text("level").notNull(),
  skills: text("skills").array().notNull(),
  isFree: boolean("is_free").default(false),
  rating: text("rating"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const savedCourses = pgTable("saved_courses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  skills: text("skills").array().notNull(),
  githubUrl: text("github_url"),
  phase: text("phase").notNull(),
  estimatedTime: text("estimated_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const savedProjects = pgTable("saved_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  extractedSkills: jsonb("extracted_skills"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  skills: many(skills),
  careerPaths: many(careerPaths),
  roadmaps: many(roadmaps),
  savedCourses: many(savedCourses),
  savedProjects: many(savedProjects),
  resumes: many(resumes),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  user: one(users, { fields: [skills.userId], references: [users.id] }),
}));

export const careerPathsRelations = relations(careerPaths, ({ one, many }) => ({
  user: one(users, { fields: [careerPaths.userId], references: [users.id] }),
  roadmaps: many(roadmaps),
}));

export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  user: one(users, { fields: [roadmaps.userId], references: [users.id] }),
  careerPath: one(careerPaths, { fields: [roadmaps.careerPathId], references: [careerPaths.id] }),
  steps: many(roadmapSteps),
}));

export const roadmapStepsRelations = relations(roadmapSteps, ({ one }) => ({
  roadmap: one(roadmaps, { fields: [roadmapSteps.roadmapId], references: [roadmaps.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  savedBy: many(savedCourses),
}));

export const savedCoursesRelations = relations(savedCourses, ({ one }) => ({
  user: one(users, { fields: [savedCourses.userId], references: [users.id] }),
  course: one(courses, { fields: [savedCourses.courseId], references: [courses.id] }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  savedBy: many(savedProjects),
}));

export const savedProjectsRelations = relations(savedProjects, ({ one }) => ({
  user: one(users, { fields: [savedProjects.userId], references: [users.id] }),
  project: one(projects, { fields: [savedProjects.projectId], references: [projects.id] }),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true });
export const insertCareerPathSchema = createInsertSchema(careerPaths).omit({ id: true, createdAt: true });
export const insertRoadmapSchema = createInsertSchema(roadmaps).omit({ id: true, createdAt: true });
export const insertRoadmapStepSchema = createInsertSchema(roadmapSteps).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertSavedCourseSchema = createInsertSchema(savedCourses).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertSavedProjectSchema = createInsertSchema(savedProjects).omit({ id: true, createdAt: true });
export const insertResumeSchema = createInsertSchema(resumes).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertCareerPath = z.infer<typeof insertCareerPathSchema>;
export type CareerPath = typeof careerPaths.$inferSelect;
export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;
export type Roadmap = typeof roadmaps.$inferSelect;
export type InsertRoadmapStep = z.infer<typeof insertRoadmapStepSchema>;
export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertSavedCourse = z.infer<typeof insertSavedCourseSchema>;
export type SavedCourse = typeof savedCourses.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertSavedProject = z.infer<typeof insertSavedProjectSchema>;
export type SavedProject = typeof savedProjects.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
