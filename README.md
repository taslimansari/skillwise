# SkillWise - Personalized Career Roadmap Platform

SkillWise is a full-stack web application that helps students and early professionals identify suitable career paths and generate AI-powered personalized learning roadmaps based on their current skills, interests, and career goals.

## Features

- **User Authentication**: Secure registration and login system
- **Skills Management**: Add skills manually or upload a resume for AI-powered skill extraction
- **Career Path Recommendations**: AI-generated career suggestions with match percentages based on your skills
- **Personalized Learning Roadmaps**: Structured learning paths divided into Beginner, Intermediate, and Advanced phases
- **Course Recommendations**: Curated courses from platforms like YouTube, Coursera, edX, and Udemy
- **Project Recommendations**: Hands-on project ideas with GitHub integration
- **Progress Tracking**: Dashboard to monitor your learning journey

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Database**: MongoDB (via Mongoose)
- **AI**: OpenAI GPT-4 for skill extraction and career recommendations
- **Authentication**: Express-session with bcrypt password hashing

---

## Quick Start

### Prerequisites

1. **Node.js** (v18 or higher) - https://nodejs.org/
2. **MongoDB** - Either:
   - **MongoDB Atlas** (cloud, free tier available) - https://www.mongodb.com/atlas
   - **MongoDB Community Server** (local installation) - https://www.mongodb.com/try/download/community
3. **OpenAI API Key** - https://platform.openai.com/api-keys

### Step 1: Clone/Download the Project

```bash
git clone <your-repo-url>
cd skillwise
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Connection String
# For MongoDB Atlas: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/skillwise
# For local MongoDB: mongodb://localhost:27017/skillwise
MONGODB_URI=your-mongodb-connection-string

# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Port (optional, defaults to 5000)
PORT=5000
```

### Step 4: Run the Application

```bash
npm run dev
```

The application will start on `http://localhost:5000`

---

## MongoDB Atlas Setup (Recommended for Cloud)

1. **Create a free account** at https://www.mongodb.com/atlas
2. **Create a cluster** (free tier M0 is sufficient)
3. **Create a database user**:
   - Go to Database Access > Add New Database User
   - Create a username and password
4. **Allow network access**:
   - Go to Network Access > Add IP Address
   - Click "Allow Access from Anywhere" or add your specific IP
5. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string and replace `<password>` with your database user's password
   - Example: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/skillwise`

---

## Local MongoDB Setup (Windows 11)

### Install MongoDB Community Server

1. **Download** from https://www.mongodb.com/try/download/community
2. **Choose**: Windows x64, MSI package
3. **During installation**:
   - Select "Complete" installation
   - Check "Install MongoDB as a Service"
   - Check "Install MongoDB Compass" (optional, helpful for viewing data)
4. MongoDB will run automatically on `localhost:27017`

### Verify Installation

Open PowerShell and run:
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# If not running, start it
Start-Service MongoDB
```

Your connection string for local MongoDB: `mongodb://localhost:27017/skillwise`

---

## Project Structure

```
skillwise/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── index.html
├── server/                 # Backend Express application
│   ├── local/              # MongoDB implementation
│   │   ├── models.ts       # Mongoose schemas
│   │   ├── mongodb.ts      # MongoDB connection
│   │   ├── storage-mongo.ts # MongoDB storage operations
│   │   └── seed-mongo.ts   # Database seeding
│   ├── routes.ts           # API routes
│   ├── ai.ts               # OpenAI integration
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Zod validation schemas
└── README.md
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update user profile

### Skills
- `GET /api/skills` - Get user's skills
- `POST /api/skills` - Add a new skill
- `DELETE /api/skills/:id` - Delete a skill
- `POST /api/skills/extract` - Upload resume and extract skills with AI

### Career Paths
- `GET /api/career-paths` - Get career recommendations
- `POST /api/career-paths/generate` - Generate new recommendations with AI
- `POST /api/career-paths/:id/select` - Select a career path

### Roadmap
- `GET /api/roadmaps/current` - Get current learning roadmap
- `PATCH /api/roadmap-steps/:id` - Update step completion status

### Courses & Projects
- `GET /api/courses` - Get all courses
- `GET /api/projects` - Get all projects
- `GET /api/saved-courses` - Get saved courses
- `POST /api/saved-courses` - Save a course
- `DELETE /api/saved-courses/:courseId` - Unsave a course
- `GET /api/saved-projects` - Get saved projects
- `POST /api/saved-projects` - Save a project
- `PATCH /api/saved-projects/:projectId` - Update saved project
- `DELETE /api/saved-projects/:projectId` - Unsave a project

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## Troubleshooting

### MongoDB Connection Issues

**MongoDB Atlas:**
1. Verify your connection string is correct
2. Ensure your IP address is whitelisted in Network Access
3. Double-check username/password

**Local MongoDB:**
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# Start if not running
Start-Service MongoDB

# Test connection
netstat -an | findstr "27017"
```

### OpenAI API Issues

1. Verify your API key is valid and has credits
2. Check for rate limits (429 errors)
3. Ensure the API key is correctly set in `.env`

### Port Already in Use

```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or change the port in `.env`:
```env
PORT=3000
```

### PDF Resume Upload Issues

1. Ensure the PDF contains text (not scanned images)
2. Keep file size under 10MB
3. Try a different PDF if one fails

---

## Development

### Available Scripts

```bash
# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Adding New Features

1. Add Mongoose models in `server/local/models.ts`
2. Add storage methods in `server/local/storage-mongo.ts`
3. Create API routes in `server/routes.ts`
4. Build frontend components in `client/src/`

---

## License

This project is open source and available under the MIT License.
