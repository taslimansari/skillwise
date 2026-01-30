import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  skills,
  careerPaths,
  roadmaps,
  roadmapSteps,
  courses,
  savedCourses,
  projects,
  savedProjects,
  resumes,
  type User,
  type InsertUser,
  type Skill,
  type InsertSkill,
  type CareerPath,
  type InsertCareerPath,
  type Roadmap,
  type InsertRoadmap,
  type RoadmapStep,
  type InsertRoadmapStep,
  type Course,
  type InsertCourse,
  type SavedCourse,
  type InsertSavedCourse,
  type Project,
  type InsertProject,
  type SavedProject,
  type InsertSavedProject,
  type Resume,
  type InsertResume,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getSkills(userId: string): Promise<Skill[]>;
  getSkill(id: number): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  createManySkills(skills: InsertSkill[]): Promise<Skill[]>;
  deleteSkill(id: number): Promise<void>;
  deleteAllSkillsForUser(userId: string): Promise<void>;

  getCareerPaths(userId: string): Promise<CareerPath[]>;
  getCareerPath(id: number): Promise<CareerPath | undefined>;
  createCareerPath(careerPath: InsertCareerPath): Promise<CareerPath>;
  createManyCareerPaths(careerPaths: InsertCareerPath[]): Promise<CareerPath[]>;
  updateCareerPath(id: number, data: Partial<InsertCareerPath>): Promise<CareerPath | undefined>;
  deleteAllCareerPathsForUser(userId: string): Promise<void>;
  selectCareerPath(userId: string, careerPathId: number): Promise<void>;

  getRoadmap(userId: string): Promise<(Roadmap & { steps: RoadmapStep[]; careerPath?: CareerPath }) | undefined>;
  createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap>;
  deleteRoadmapsForUser(userId: string): Promise<void>;

  getRoadmapSteps(roadmapId: number): Promise<RoadmapStep[]>;
  createRoadmapStep(step: InsertRoadmapStep): Promise<RoadmapStep>;
  createManyRoadmapSteps(steps: InsertRoadmapStep[]): Promise<RoadmapStep[]>;
  updateRoadmapStep(id: number, data: Partial<InsertRoadmapStep>): Promise<RoadmapStep | undefined>;

  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  createManyCourses(courses: InsertCourse[]): Promise<Course[]>;

  getSavedCourses(userId: string): Promise<(SavedCourse & { course: Course })[]>;
  createSavedCourse(savedCourse: InsertSavedCourse): Promise<SavedCourse>;
  deleteSavedCourse(userId: string, courseId: number): Promise<void>;

  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  createManyProjects(projects: InsertProject[]): Promise<Project[]>;

  getSavedProjects(userId: string): Promise<(SavedProject & { project: Project })[]>;
  createSavedProject(savedProject: InsertSavedProject): Promise<SavedProject>;
  updateSavedProject(userId: string, projectId: number, data: Partial<InsertSavedProject>): Promise<SavedProject | undefined>;
  deleteSavedProject(userId: string, projectId: number): Promise<void>;

  createResume(resume: InsertResume): Promise<Resume>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getSkills(userId: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.userId, userId)).orderBy(desc(skills.createdAt));
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
    return skill;
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async createManySkills(skillsData: InsertSkill[]): Promise<Skill[]> {
    if (skillsData.length === 0) return [];
    return db.insert(skills).values(skillsData).returning();
  }

  async deleteSkill(id: number): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  async deleteAllSkillsForUser(userId: string): Promise<void> {
    await db.delete(skills).where(eq(skills.userId, userId));
  }

  async getCareerPaths(userId: string): Promise<CareerPath[]> {
    return db.select().from(careerPaths).where(eq(careerPaths.userId, userId)).orderBy(desc(careerPaths.matchPercentage));
  }

  async getCareerPath(id: number): Promise<CareerPath | undefined> {
    const [careerPath] = await db.select().from(careerPaths).where(eq(careerPaths.id, id)).limit(1);
    return careerPath;
  }

  async createCareerPath(careerPath: InsertCareerPath): Promise<CareerPath> {
    const [newCareerPath] = await db.insert(careerPaths).values(careerPath).returning();
    return newCareerPath;
  }

  async createManyCareerPaths(careerPathsData: InsertCareerPath[]): Promise<CareerPath[]> {
    if (careerPathsData.length === 0) return [];
    return db.insert(careerPaths).values(careerPathsData).returning();
  }

  async updateCareerPath(id: number, data: Partial<InsertCareerPath>): Promise<CareerPath | undefined> {
    const [careerPath] = await db.update(careerPaths).set(data).where(eq(careerPaths.id, id)).returning();
    return careerPath;
  }

  async deleteAllCareerPathsForUser(userId: string): Promise<void> {
    await db.delete(careerPaths).where(eq(careerPaths.userId, userId));
  }

  async selectCareerPath(userId: string, careerPathId: number): Promise<void> {
    await db.update(careerPaths).set({ isSelected: false }).where(eq(careerPaths.userId, userId));
    await db.update(careerPaths).set({ isSelected: true }).where(eq(careerPaths.id, careerPathId));
  }

  async getRoadmap(userId: string): Promise<(Roadmap & { steps: RoadmapStep[]; careerPath?: CareerPath }) | undefined> {
    const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.userId, userId)).orderBy(desc(roadmaps.createdAt)).limit(1);
    if (!roadmap) return undefined;

    const steps = await db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, roadmap.id)).orderBy(roadmapSteps.orderIndex);
    
    let careerPath: CareerPath | undefined;
    if (roadmap.careerPathId) {
      const [cp] = await db.select().from(careerPaths).where(eq(careerPaths.id, roadmap.careerPathId)).limit(1);
      careerPath = cp;
    }

    return { ...roadmap, steps, careerPath };
  }

  async createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap> {
    const [newRoadmap] = await db.insert(roadmaps).values(roadmap).returning();
    return newRoadmap;
  }

  async deleteRoadmapsForUser(userId: string): Promise<void> {
    await db.delete(roadmaps).where(eq(roadmaps.userId, userId));
  }

  async getRoadmapSteps(roadmapId: number): Promise<RoadmapStep[]> {
    return db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, roadmapId)).orderBy(roadmapSteps.orderIndex);
  }

  async createRoadmapStep(step: InsertRoadmapStep): Promise<RoadmapStep> {
    const [newStep] = await db.insert(roadmapSteps).values(step).returning();
    return newStep;
  }

  async createManyRoadmapSteps(stepsData: InsertRoadmapStep[]): Promise<RoadmapStep[]> {
    if (stepsData.length === 0) return [];
    return db.insert(roadmapSteps).values(stepsData).returning();
  }

  async updateRoadmapStep(id: number, data: Partial<InsertRoadmapStep>): Promise<RoadmapStep | undefined> {
    const [step] = await db.update(roadmapSteps).set(data).where(eq(roadmapSteps.id, id)).returning();
    return step;
  }

  async getCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(courses.title);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async createManyCourses(coursesData: InsertCourse[]): Promise<Course[]> {
    if (coursesData.length === 0) return [];
    return db.insert(courses).values(coursesData).returning();
  }

  async getSavedCourses(userId: string): Promise<(SavedCourse & { course: Course })[]> {
    const results = await db
      .select()
      .from(savedCourses)
      .innerJoin(courses, eq(savedCourses.courseId, courses.id))
      .where(eq(savedCourses.userId, userId));
    
    return results.map((r) => ({
      ...r.saved_courses,
      course: r.courses,
    }));
  }

  async createSavedCourse(savedCourse: InsertSavedCourse): Promise<SavedCourse> {
    const [newSavedCourse] = await db.insert(savedCourses).values(savedCourse).returning();
    return newSavedCourse;
  }

  async deleteSavedCourse(userId: string, courseId: number): Promise<void> {
    await db.delete(savedCourses).where(
      and(eq(savedCourses.userId, userId), eq(savedCourses.courseId, courseId))
    );
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(projects.title);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async createManyProjects(projectsData: InsertProject[]): Promise<Project[]> {
    if (projectsData.length === 0) return [];
    return db.insert(projects).values(projectsData).returning();
  }

  async getSavedProjects(userId: string): Promise<(SavedProject & { project: Project })[]> {
    const results = await db
      .select()
      .from(savedProjects)
      .innerJoin(projects, eq(savedProjects.projectId, projects.id))
      .where(eq(savedProjects.userId, userId));
    
    return results.map((r) => ({
      ...r.saved_projects,
      project: r.projects,
    }));
  }

  async createSavedProject(savedProject: InsertSavedProject): Promise<SavedProject> {
    const [newSavedProject] = await db.insert(savedProjects).values(savedProject).returning();
    return newSavedProject;
  }

  async updateSavedProject(userId: string, projectId: number, data: Partial<InsertSavedProject>): Promise<SavedProject | undefined> {
    const [savedProject] = await db
      .update(savedProjects)
      .set(data)
      .where(and(eq(savedProjects.userId, userId), eq(savedProjects.projectId, projectId)))
      .returning();
    return savedProject;
  }

  async deleteSavedProject(userId: string, projectId: number): Promise<void> {
    await db.delete(savedProjects).where(
      and(eq(savedProjects.userId, userId), eq(savedProjects.projectId, projectId))
    );
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const [newResume] = await db.insert(resumes).values(resume).returning();
    return newResume;
  }
}

export const storage = new DatabaseStorage();
