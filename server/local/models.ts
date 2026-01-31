import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  education?: string;
  currentRole?: string;
  experienceLevel?: string;
  interests?: string[];
  careerGoals?: string[];
  createdAt: Date;
}

export interface ISkill extends Document {
  userId: string;
  name: string;
  category: "technical" | "tools" | "soft";
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  createdAt: Date;
}

export interface ICareerPath extends Document {
  userId: string;
  title: string;
  description: string;
  matchPercentage: number;
  matchReasons: string[];
  requiredSkills: string[];
  salaryRange?: string;
  demandLevel?: string;
  isSelected: boolean;
  createdAt: Date;
}

export interface IRoadmap extends Document {
  userId: string;
  careerPathId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface IRoadmapStep extends Document {
  roadmapId: mongoose.Types.ObjectId;
  phase: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  description: string;
  skills: string[];
  duration?: string;
  orderIndex: number;
  isCompleted: boolean;
  createdAt: Date;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  platform: string;
  url: string;
  imageUrl?: string;
  instructor?: string;
  duration?: string;
  level: string;
  skills: string[];
  isFree: boolean;
  rating?: string;
  createdAt: Date;
}

export interface ISavedCourse extends Document {
  userId: string;
  courseId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IProject extends Document {
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  githubUrl?: string;
  phase: string;
  estimatedTime?: string;
  createdAt: Date;
}

export interface ISavedProject extends Document {
  userId: string;
  projectId: mongoose.Types.ObjectId;
  isCompleted: boolean;
  createdAt: Date;
}

export interface IResume extends Document {
  userId: string;
  filename: string;
  extractedSkills?: any;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  education: String,
  currentRole: String,
  experienceLevel: String,
  interests: [String],
  careerGoals: [String],
  createdAt: { type: Date, default: Date.now },
});

const SkillSchema = new Schema<ISkill>({
  userId: { type: String, required: true, ref: "User" },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ["technical", "tools", "soft"] },
  proficiency: { type: String, required: true, enum: ["beginner", "intermediate", "advanced", "expert"] },
  createdAt: { type: Date, default: Date.now },
});

const CareerPathSchema = new Schema<ICareerPath>({
  userId: { type: String, required: true, ref: "User" },
  title: { type: String, required: true },
  description: { type: String, required: true },
  matchPercentage: { type: Number, required: true },
  matchReasons: { type: [String], required: true },
  requiredSkills: { type: [String], required: true },
  salaryRange: String,
  demandLevel: String,
  isSelected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const RoadmapSchema = new Schema<IRoadmap>({
  userId: { type: String, required: true, ref: "User" },
  careerPathId: { type: Schema.Types.ObjectId, ref: "CareerPath" },
  title: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const RoadmapStepSchema = new Schema<IRoadmapStep>({
  roadmapId: { type: Schema.Types.ObjectId, required: true, ref: "Roadmap" },
  phase: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  skills: { type: [String], required: true },
  duration: String,
  orderIndex: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  platform: { type: String, required: true },
  url: { type: String, required: true },
  imageUrl: String,
  instructor: String,
  duration: String,
  level: { type: String, required: true },
  skills: { type: [String], required: true },
  isFree: { type: Boolean, default: false },
  rating: String,
  createdAt: { type: Date, default: Date.now },
});

const SavedCourseSchema = new Schema<ISavedCourse>({
  userId: { type: String, required: true, ref: "User" },
  courseId: { type: Schema.Types.ObjectId, required: true, ref: "Course" },
  createdAt: { type: Date, default: Date.now },
});

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: true },
  skills: { type: [String], required: true },
  githubUrl: String,
  phase: { type: String, required: true },
  estimatedTime: String,
  createdAt: { type: Date, default: Date.now },
});

const SavedProjectSchema = new Schema<ISavedProject>({
  userId: { type: String, required: true, ref: "User" },
  projectId: { type: Schema.Types.ObjectId, required: true, ref: "Project" },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const ResumeSchema = new Schema<IResume>({
  userId: { type: String, required: true, ref: "User" },
  filename: { type: String, required: true },
  extractedSkills: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

SkillSchema.index({ userId: 1 });
CareerPathSchema.index({ userId: 1 });
RoadmapSchema.index({ userId: 1 });
RoadmapStepSchema.index({ roadmapId: 1 });
SavedCourseSchema.index({ userId: 1 });
SavedProjectSchema.index({ userId: 1 });
ResumeSchema.index({ userId: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
export const Skill = mongoose.model<ISkill>("Skill", SkillSchema);
export const CareerPath = mongoose.model<ICareerPath>("CareerPath", CareerPathSchema);
export const Roadmap = mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);
export const RoadmapStep = mongoose.model<IRoadmapStep>("RoadmapStep", RoadmapStepSchema);
export const Course = mongoose.model<ICourse>("Course", CourseSchema);
export const SavedCourse = mongoose.model<ISavedCourse>("SavedCourse", SavedCourseSchema);
export const Project = mongoose.model<IProject>("Project", ProjectSchema);
export const SavedProject = mongoose.model<ISavedProject>("SavedProject", SavedProjectSchema);
export const Resume = mongoose.model<IResume>("Resume", ResumeSchema);
