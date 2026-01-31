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

The server uses a modular structure with routes defined in `server/routes.ts`, AI functionality in `server/ai.ts`, and database operations abstracted through `server/storage.ts`.

### Database Layer
- **Primary ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Schema Design**: Includes users, skills, career_paths, roadmaps, roadmap_steps, courses, projects, and saved items tables
- **Migrations**: Managed via drizzle-kit (`npm run db:push`)

**Local Development with MongoDB**: The codebase includes a complete MongoDB implementation under `server/local/` for running the project locally on Windows without Docker:
- `server/local/models.ts` - Mongoose schemas for all collections
- `server/local/mongodb.ts` - MongoDB connection handler
- `server/local/storage-mongo.ts` - MongoDB storage implementation (drop-in replacement for storage.ts)
- `server/local/seed-mongo.ts` - Database seeding script for courses and projects

See `README.md` for detailed local setup instructions.

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

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### AI Services
- **OpenAI API**: GPT-4 for AI features (skill extraction, career recommendations, roadmap generation)
- Accessed through Replit AI Integrations proxy

### Authentication
- **express-session**: Server-side session management
- **bcrypt**: Password hashing
- **connect-pg-simple**: PostgreSQL session store (optional)

### Third-Party Course/Project Platforms
The application references external learning platforms for course recommendations:
- YouTube
- Coursera
- edX
- Udemy
- freeCodeCamp
- GitHub (for project references)

### Replit Integrations
Located in `server/replit_integrations/` and `client/replit_integrations/`:
- **Chat**: Conversation storage and streaming chat routes
- **Audio**: Voice recording, playback, and speech-to-text capabilities
- **Image**: Image generation via OpenAI
- **Batch**: Rate-limited batch processing utilities

### Key NPM Packages
- `@tanstack/react-query`: Data fetching and caching
- `zod`: Schema validation (shared between client/server)
- `drizzle-zod`: Generate Zod schemas from Drizzle tables
- `multer`: File upload handling
- `pdf-parse`: Resume PDF parsing