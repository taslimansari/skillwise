import OpenAI from "openai";
import type { Skill, User, CareerPath } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface CareerRecommendation {
  title: string;
  description: string;
  matchPercentage: number;
  matchReasons: string[];
  requiredSkills: string[];
  salaryRange: string;
  demandLevel: string;
}

interface RoadmapData {
  title: string;
  description: string;
  steps: {
    phase: "Beginner" | "Intermediate" | "Advanced";
    title: string;
    description: string;
    skills: string[];
    duration: string;
  }[];
}

interface ExtractedSkill {
  name: string;
  category: "technical" | "tools" | "soft";
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
}

export async function generateCareerRecommendations(
  skills: Skill[],
  user: User
): Promise<CareerRecommendation[]> {
  const skillsList = skills.map((s) => `${s.name} (${s.proficiency}, ${s.category})`).join(", ");
  
  const prompt = `Based on the following user profile and skills, recommend 3-5 suitable career paths.

User Profile:
- Name: ${user.name}
- Education: ${user.education || "Not specified"}
- Current Role: ${user.currentRole || "Not specified"}
- Experience Level: ${user.experienceLevel || "Not specified"}
- Interests: ${user.interests?.join(", ") || "Not specified"}
- Career Goals: ${user.careerGoals?.join(", ") || "Not specified"}

Skills:
${skillsList}

For each career path, provide:
1. A job title
2. A brief description (2-3 sentences)
3. Match percentage (based on how well their skills align)
4. 3 specific reasons why this suits them
5. Required skills for this career
6. Salary range (e.g., "$70,000 - $120,000")
7. Demand level (High, Medium, or Low)

Return your response as a JSON array with objects containing: title, description, matchPercentage (number 0-100), matchReasons (array of strings), requiredSkills (array of strings), salaryRange (string), demandLevel (string).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career counselor AI. Analyze skills and provide personalized career recommendations. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from AI");

    const parsed = JSON.parse(content);
    const recommendations = parsed.careers || parsed.recommendations || parsed;
    
    if (!Array.isArray(recommendations)) {
      return Object.values(recommendations).filter(Array.isArray)[0] || [];
    }
    
    return recommendations;
  } catch (error) {
    console.error("AI career recommendation error:", error);
    return getDefaultCareerRecommendations(skills);
  }
}

export async function generateRoadmap(
  careerPath: CareerPath,
  currentSkills: Skill[]
): Promise<RoadmapData> {
  const currentSkillNames = currentSkills.map((s) => s.name).join(", ");

  const prompt = `Create a detailed learning roadmap for someone wanting to become a ${careerPath.title}.

Current Skills: ${currentSkillNames}
Required Skills for Career: ${careerPath.requiredSkills.join(", ")}
Career Description: ${careerPath.description}

Create a structured roadmap with 9-12 learning steps divided into three phases:
- Beginner (3-4 steps): Foundation skills and concepts
- Intermediate (3-4 steps): Applied knowledge and practical experience
- Advanced (3-4 steps): Specialization and mastery

For each step, provide:
1. A clear title
2. A description of what to learn (2-3 sentences)
3. Skills that will be gained
4. Estimated duration (e.g., "2-3 weeks", "1 month")

Return your response as a JSON object with:
- title: "Roadmap to [Career Title]"
- description: Brief overview of the roadmap
- steps: Array of step objects with phase, title, description, skills (array), and duration`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a learning path designer. Create comprehensive, practical learning roadmaps. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from AI");

    return JSON.parse(content);
  } catch (error) {
    console.error("AI roadmap generation error:", error);
    return getDefaultRoadmap(careerPath);
  }
}

export async function extractSkillsFromText(
  text: string
): Promise<ExtractedSkill[]> {
  const prompt = `Extract professional skills from the following resume/CV text. 

Text:
${text.substring(0, 4000)}

Identify all skills mentioned and categorize them:
- technical: Programming languages, frameworks, methodologies (e.g., Python, React, Agile)
- tools: Software, platforms, development tools (e.g., Git, Docker, AWS)
- soft: Communication, leadership, interpersonal skills (e.g., Team Leadership, Communication)

For each skill, estimate proficiency based on context:
- beginner: Just mentioned or listed
- intermediate: Used in projects
- advanced: Significant experience mentioned
- expert: Leadership or teaching mentioned

Return a JSON object with a "skills" array containing objects with: name, category, proficiency.
Limit to the top 15-20 most relevant skills.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a resume parser AI. Extract and categorize professional skills from resumes. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("No content from AI response");
      return [];
    }

    const parsed = JSON.parse(content);
    const skills = parsed.skills || [];
    console.log(`AI extracted ${skills.length} skills from resume`);
    return skills;
  } catch (error: any) {
    console.error("AI skill extraction error:", error?.message || error);
    // Don't throw - return empty array so user can add skills manually
    return [];
  }
}

function getDefaultCareerRecommendations(skills: Skill[]): CareerRecommendation[] {
  const hasWebSkills = skills.some((s) =>
    ["javascript", "typescript", "react", "html", "css", "node"].some((tech) =>
      s.name.toLowerCase().includes(tech)
    )
  );

  const hasDataSkills = skills.some((s) =>
    ["python", "sql", "data", "analytics", "machine learning", "statistics"].some((tech) =>
      s.name.toLowerCase().includes(tech)
    )
  );

  const recommendations: CareerRecommendation[] = [];

  if (hasWebSkills) {
    recommendations.push({
      title: "Full-Stack Developer",
      description: "Build complete web applications from frontend to backend. Work with modern frameworks and databases to create scalable solutions.",
      matchPercentage: 85,
      matchReasons: [
        "Your JavaScript/TypeScript skills are highly valued",
        "Frontend experience translates directly to this role",
        "Growing demand for full-stack developers in the industry",
      ],
      requiredSkills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "REST APIs"],
      salaryRange: "$80,000 - $150,000",
      demandLevel: "High",
    });
  }

  if (hasDataSkills) {
    recommendations.push({
      title: "Data Analyst",
      description: "Transform raw data into actionable insights. Use statistical analysis and visualization to drive business decisions.",
      matchPercentage: 80,
      matchReasons: [
        "Your analytical skills are perfect for data analysis",
        "SQL and Python knowledge is essential for this role",
        "Data-driven decision making is increasingly important",
      ],
      requiredSkills: ["Python", "SQL", "Excel", "Data Visualization", "Statistics"],
      salaryRange: "$60,000 - $100,000",
      demandLevel: "High",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Software Developer",
      description: "Design, develop, and maintain software applications. Work with various technologies to solve complex problems.",
      matchPercentage: 70,
      matchReasons: [
        "Software development is a versatile career path",
        "Your existing skills provide a foundation to build on",
        "Continuous learning is valued in this field",
      ],
      requiredSkills: ["Programming", "Problem Solving", "Version Control", "Testing", "Documentation"],
      salaryRange: "$70,000 - $130,000",
      demandLevel: "High",
    });
  }

  return recommendations;
}

function getDefaultRoadmap(careerPath: CareerPath): RoadmapData {
  return {
    title: `Roadmap to ${careerPath.title}`,
    description: `A comprehensive learning path to become a ${careerPath.title}. Follow these steps to build your skills progressively.`,
    steps: [
      {
        phase: "Beginner",
        title: "Foundation Skills",
        description: "Build a strong foundation in the core concepts required for this career path.",
        skills: careerPath.requiredSkills.slice(0, 2),
        duration: "2-3 weeks",
      },
      {
        phase: "Beginner",
        title: "Essential Tools",
        description: "Learn the essential tools and technologies used in the industry.",
        skills: ["Version Control", "Development Environment"],
        duration: "1-2 weeks",
      },
      {
        phase: "Beginner",
        title: "Basic Projects",
        description: "Apply your knowledge by building small practice projects.",
        skills: ["Problem Solving", "Project Structure"],
        duration: "2-3 weeks",
      },
      {
        phase: "Intermediate",
        title: "Advanced Concepts",
        description: "Dive deeper into advanced topics and best practices.",
        skills: careerPath.requiredSkills.slice(2, 4),
        duration: "3-4 weeks",
      },
      {
        phase: "Intermediate",
        title: "Real-World Projects",
        description: "Build portfolio-worthy projects that demonstrate your skills.",
        skills: ["Project Management", "Documentation"],
        duration: "4-6 weeks",
      },
      {
        phase: "Intermediate",
        title: "Collaboration Skills",
        description: "Learn to work effectively in teams and contribute to larger projects.",
        skills: ["Team Collaboration", "Code Review"],
        duration: "2-3 weeks",
      },
      {
        phase: "Advanced",
        title: "Specialization",
        description: "Focus on a specific area within your career path to become an expert.",
        skills: careerPath.requiredSkills.slice(4, 6),
        duration: "4-6 weeks",
      },
      {
        phase: "Advanced",
        title: "Industry Best Practices",
        description: "Learn industry standards and best practices for professional work.",
        skills: ["Architecture", "Performance Optimization"],
        duration: "3-4 weeks",
      },
      {
        phase: "Advanced",
        title: "Career Preparation",
        description: "Prepare for job interviews and build your professional network.",
        skills: ["Interview Skills", "Networking"],
        duration: "2-3 weeks",
      },
    ],
  };
}
