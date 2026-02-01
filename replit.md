# SkillWise - Personalized Career Roadmap Platform

## Overview

SkillWise is a full-stack web application that helps students and early professionals identify suitable career paths and generate AI-powered personalized learning roadmaps based on their current skills. Users can add skills manually or upload resumes for AI-powered skill extraction, receive career recommendations with match percentages, and track their progress through structured learning phases.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a page-based structure under `client/src/pages/` with shared components in `client/src/components/`. Authentication state is managed through a React context provider (`lib/auth.tsx`).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Session Management**: Express-session with cookie-based authentication
- **Password Security**: bcrypt for password hashing
- **File Uploads**: Multer for handling resume uploads (PDF parsing)

The server uses a modular structure with routes defined in `server/routes.ts`, AI functionality in `server/ai.ts`, and database operations in `server/local/storage-mongo.ts`.

### Database Layer
- **Database**: MongoDB (via Mongoose ODM)
- **Connection**: Requires `MONGODB_URI` environment variable
- **Models Location**: `server/local/models.ts` - Mongoose schemas for all collections
- **Storage Implementation**: `server/local/storage-mongo.ts` - All CRUD operations
- **Seeding**: `server/local/seed-mongo.ts` - Seeds courses and projects data

**Collections:**
- `users` - User accounts with authentication
- `skills` - User skills with proficiency levels
- `careerpaths` - AI-generated career recommendations
- `roadmaps` - Learning roadmaps with steps
- `courses` - Available courses from various platforms
- `projects` - Project recommendations
- `savedcourses` - User's saved courses
- `savedprojects` - User's saved projects with progress tracking

### AI Integration
- **Provider**: OpenAI GPT-4 via Replit AI Integrations
- **Features**: 
  - Skill extraction from resume text
  - Career path recommendations based on user skills
  - Personalized learning roadmap generation
- **Configuration**: Uses environment variables `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Custom build script (`script/build.ts`) using esbuild for server bundling and Vite for client build
- **Output**: Server bundle to `dist/index.cjs`, client assets to `dist/public/`

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local) |
| `SESSION_SECRET` | Yes | Secret for session encryption |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI API key (auto-configured on Replit) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | OpenAI base URL (auto-configured on Replit) |

## External Dependencies

### Database
- **MongoDB**: Primary database, connection via `MONGODB_URI` environment variable
- **Mongoose**: ODM for MongoDB with type-safe schemas

### AI Services
- **OpenAI API**: GPT-4 for AI features (skill extraction, career recommendations, roadmap generation)
- Accessed through Replit AI Integrations proxy

### Authentication
- **express-session**: Server-side session management
- **bcrypt**: Password hashing

### Third-Party Course/Project Platforms
The application references external learning platforms for course recommendations:
- YouTube
- Coursera
- edX
- Udemy
- freeCodeCamp
- GitHub (for project references)

### Key NPM Packages
- `mongoose`: MongoDB ODM
- `@tanstack/react-query`: Data fetching and caching
- `zod`: Schema validation (shared between client/server)
- `multer`: File upload handling
- `pdf-parse`: Resume PDF parsing

## Running Locally on Windows 11

1. Install Node.js (v18+) from https://nodejs.org/
2. Install MongoDB Community Server from https://www.mongodb.com/try/download/community
3. Clone the repository and run `npm install`
4. Create `.env` file with `MONGODB_URI=mongodb://localhost:27017/skillwise`
5. Run `npm run dev`

See `README.md` for detailed instructions.
