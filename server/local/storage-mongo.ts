import mongoose from "mongoose";
import {
  User,
  Skill,
  CareerPath,
  Roadmap,
  RoadmapStep,
  Course,
  SavedCourse,
  Project,
  SavedProject,
  Resume,
} from "./models";

function toPlainObject(doc: any): any {
  if (!doc) return undefined;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  return obj;
}

function toPlainArray(docs: any[]): any[] {
  return docs.map(toPlainObject);
}

export class MongoStorage {
  async getUser(id: string) {
    const user = await User.findById(id);
    return toPlainObject(user);
  }

  async getUserByEmail(email: string) {
    const user = await User.findOne({ email });
    return toPlainObject(user);
  }

  async createUser(userData: any) {
    const user = new User(userData);
    await user.save();
    return toPlainObject(user);
  }

  async updateUser(id: string, data: any) {
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    return toPlainObject(user);
  }

  async getSkills(userId: string) {
    const skills = await Skill.find({ userId }).sort({ createdAt: -1 });
    return toPlainArray(skills);
  }

  async getSkill(id: string) {
    const skill = await Skill.findById(id);
    return toPlainObject(skill);
  }

  async createSkill(skillData: any) {
    const skill = new Skill(skillData);
    await skill.save();
    return toPlainObject(skill);
  }

  async createManySkills(skillsData: any[]) {
    if (skillsData.length === 0) return [];
    const skills = await Skill.insertMany(skillsData);
    return toPlainArray(skills);
  }

  async deleteSkill(id: string) {
    await Skill.findByIdAndDelete(id);
  }

  async deleteAllSkillsForUser(userId: string) {
    await Skill.deleteMany({ userId });
  }

  async getCareerPaths(userId: string) {
    const paths = await CareerPath.find({ userId }).sort({ matchPercentage: -1 });
    return toPlainArray(paths);
  }

  async getCareerPath(id: string) {
    const path = await CareerPath.findById(id);
    return toPlainObject(path);
  }

  async createCareerPath(pathData: any) {
    const path = new CareerPath(pathData);
    await path.save();
    return toPlainObject(path);
  }

  async createManyCareerPaths(pathsData: any[]) {
    if (pathsData.length === 0) return [];
    const paths = await CareerPath.insertMany(pathsData);
    return toPlainArray(paths);
  }

  async updateCareerPath(id: string, data: any) {
    const path = await CareerPath.findByIdAndUpdate(id, data, { new: true });
    return toPlainObject(path);
  }

  async deleteAllCareerPathsForUser(userId: string) {
    await CareerPath.deleteMany({ userId });
  }

  async selectCareerPath(userId: string, careerPathId: string) {
    await CareerPath.updateMany({ userId }, { isSelected: false });
    await CareerPath.findByIdAndUpdate(careerPathId, { isSelected: true });
  }

  async getRoadmap(userId: string) {
    const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
    if (!roadmap) return undefined;

    const steps = await RoadmapStep.find({ roadmapId: roadmap._id }).sort({ orderIndex: 1 });
    
    let careerPath;
    if (roadmap.careerPathId) {
      careerPath = await CareerPath.findById(roadmap.careerPathId);
    }

    return {
      ...toPlainObject(roadmap),
      steps: toPlainArray(steps),
      careerPath: toPlainObject(careerPath),
    };
  }

  async createRoadmap(roadmapData: any) {
    const roadmap = new Roadmap(roadmapData);
    await roadmap.save();
    return toPlainObject(roadmap);
  }

  async deleteRoadmapsForUser(userId: string) {
    const roadmaps = await Roadmap.find({ userId });
    const roadmapIds = roadmaps.map((r) => r._id);
    await RoadmapStep.deleteMany({ roadmapId: { $in: roadmapIds } });
    await Roadmap.deleteMany({ userId });
  }

  async getRoadmapSteps(roadmapId: string) {
    const steps = await RoadmapStep.find({ roadmapId: new mongoose.Types.ObjectId(roadmapId) }).sort({ orderIndex: 1 });
    return toPlainArray(steps);
  }

  async createRoadmapStep(stepData: any) {
    const step = new RoadmapStep({
      ...stepData,
      roadmapId: new mongoose.Types.ObjectId(stepData.roadmapId),
    });
    await step.save();
    return toPlainObject(step);
  }

  async createManyRoadmapSteps(stepsData: any[]) {
    if (stepsData.length === 0) return [];
    const stepsWithObjectIds = stepsData.map((step) => ({
      ...step,
      roadmapId: new mongoose.Types.ObjectId(step.roadmapId),
    }));
    const steps = await RoadmapStep.insertMany(stepsWithObjectIds);
    return toPlainArray(steps);
  }

  async updateRoadmapStep(id: string, data: any) {
    const step = await RoadmapStep.findByIdAndUpdate(id, data, { new: true });
    return toPlainObject(step);
  }

  async getCourses() {
    const courses = await Course.find().sort({ title: 1 });
    return toPlainArray(courses);
  }

  async getCourse(id: string) {
    const course = await Course.findById(id);
    return toPlainObject(course);
  }

  async createCourse(courseData: any) {
    const course = new Course(courseData);
    await course.save();
    return toPlainObject(course);
  }

  async createManyCourses(coursesData: any[]) {
    if (coursesData.length === 0) return [];
    const courses = await Course.insertMany(coursesData);
    return toPlainArray(courses);
  }

  async getSavedCourses(userId: string) {
    const savedCourses = await SavedCourse.find({ userId }).populate("courseId");
    return savedCourses.map((sc: any) => ({
      ...toPlainObject(sc),
      course: toPlainObject(sc.courseId),
    }));
  }

  async createSavedCourse(savedCourseData: any) {
    const savedCourse = new SavedCourse({
      ...savedCourseData,
      courseId: new mongoose.Types.ObjectId(savedCourseData.courseId),
    });
    await savedCourse.save();
    return toPlainObject(savedCourse);
  }

  async deleteSavedCourse(userId: string, courseId: string) {
    await SavedCourse.deleteOne({ userId, courseId: new mongoose.Types.ObjectId(courseId) });
  }

  async getProjects() {
    const projects = await Project.find().sort({ title: 1 });
    return toPlainArray(projects);
  }

  async getProject(id: string) {
    const project = await Project.findById(id);
    return toPlainObject(project);
  }

  async createProject(projectData: any) {
    const project = new Project(projectData);
    await project.save();
    return toPlainObject(project);
  }

  async createManyProjects(projectsData: any[]) {
    if (projectsData.length === 0) return [];
    const projects = await Project.insertMany(projectsData);
    return toPlainArray(projects);
  }

  async getSavedProjects(userId: string) {
    const savedProjects = await SavedProject.find({ userId }).populate("projectId");
    return savedProjects.map((sp: any) => ({
      ...toPlainObject(sp),
      project: toPlainObject(sp.projectId),
    }));
  }

  async createSavedProject(savedProjectData: any) {
    const savedProject = new SavedProject({
      ...savedProjectData,
      projectId: new mongoose.Types.ObjectId(savedProjectData.projectId),
    });
    await savedProject.save();
    return toPlainObject(savedProject);
  }

  async updateSavedProject(userId: string, projectId: string, data: any) {
    const savedProject = await SavedProject.findOneAndUpdate(
      { userId, projectId: new mongoose.Types.ObjectId(projectId) },
      data,
      { new: true }
    );
    return toPlainObject(savedProject);
  }

  async deleteSavedProject(userId: string, projectId: string) {
    await SavedProject.deleteOne({ userId, projectId: new mongoose.Types.ObjectId(projectId) });
  }

  async createResume(resumeData: any) {
    const resume = new Resume(resumeData);
    await resume.save();
    return toPlainObject(resume);
  }
}

export const mongoStorage = new MongoStorage();
