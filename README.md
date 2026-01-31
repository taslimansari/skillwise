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
- **Database**: MongoDB (local) / PostgreSQL (Replit)
- **AI**: OpenAI GPT-4 for skill extraction and career recommendations
- **Authentication**: Express-session with bcrypt password hashing

---

## Running Locally on Windows 11 (Without Docker)

This guide will help you set up and run SkillWise on your Windows 11 machine using MongoDB.

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **MongoDB Community Server**
   - Download from: https://www.mongodb.com/try/download/community
   - Choose "Windows x64" and the MSI package
   - During installation:
     - Select "Complete" installation
     - Check "Install MongoDB as a Service"
     - Check "Install MongoDB Compass" (optional, but helpful for viewing data)
   - MongoDB will run automatically on `localhost:27017`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/download/win

4. **OpenAI API Key**
   - Get one from: https://platform.openai.com/api-keys
   - You'll need this for AI features (skill extraction, career recommendations)

### Step 1: Clone or Download the Project

```bash
# Using Git
git clone <your-repo-url>
cd skillwise

# Or download and extract the ZIP file
```

### Step 2: Install Dependencies

Open PowerShell or Command Prompt in the project folder:

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Connection (local MongoDB)
MONGODB_URI=mongodb://localhost:27017/skillwise

# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Port (optional, defaults to 5000)
PORT=5000
```

### Step 4: Switch to MongoDB Mode

The project is configured to use PostgreSQL by default (for Replit). To switch to MongoDB for local development:

1. **Update `server/index.ts`** - Replace the database import:

```typescript
// At the top of the file, change:
// import { runSeed } from "./seed";

// To:
import { seedMongoDB } from "./local/seed-mongo";
import { connectMongoDB } from "./local/mongodb";
```

2. **Update the server startup** - Modify the listen callback:

```typescript
// Change the app.listen section to:
(async () => {
  await connectMongoDB();
  await seedMongoDB();
  
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
```

3. **Update `server/routes.ts`** - Replace storage import:

```typescript
// At the top, change:
// import { storage } from "./storage";

// To:
import { mongoStorage as storage } from "./local/storage-mongo";
```

4. **Update `server/ai.ts`** - Use your OpenAI API key:

```typescript
// Change the OpenAI initialization to:
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### Step 5: Start MongoDB

Make sure MongoDB is running. If installed as a service, it should start automatically. You can verify by:

1. Open MongoDB Compass and connect to `mongodb://localhost:27017`
2. Or run in PowerShell: `Get-Service MongoDB`

### Step 6: Run the Application

```bash
npm run dev
```

The application will start on `http://localhost:5000`

### Step 7: Access the Application

1. Open your browser and go to `http://localhost:5000`
2. Register a new account
3. Start adding your skills and explore career recommendations!

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
│   ├── local/              # MongoDB-specific files for local dev
│   │   ├── models.ts       # Mongoose schemas
│   │   ├── mongodb.ts      # MongoDB connection
│   │   ├── storage-mongo.ts # MongoDB storage implementation
│   │   └── seed-mongo.ts   # Database seeding
│   ├── routes.ts           # API routes
│   ├── storage.ts          # PostgreSQL storage (Replit)
│   ├── ai.ts               # OpenAI integration
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schemas (Drizzle/PostgreSQL)
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
- `GET /api/roadmap` - Get current learning roadmap
- `POST /api/roadmap/generate` - Generate a new roadmap with AI
- `PATCH /api/roadmap/steps/:id` - Update step completion status

### Courses & Projects
- `GET /api/courses` - Get all courses
- `GET /api/projects` - Get all projects
- `GET /api/saved-courses` - Get saved courses
- `POST /api/saved-courses` - Save a course
- `DELETE /api/saved-courses/:courseId` - Unsave a course
- `GET /api/saved-projects` - Get saved projects
- `POST /api/saved-projects` - Save a project
- `DELETE /api/saved-projects/:projectId` - Unsave a project

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## Troubleshooting

### MongoDB Connection Issues

1. **Verify MongoDB is running**:
   ```powershell
   Get-Service MongoDB
   ```
   If not running:
   ```powershell
   Start-Service MongoDB
   ```

2. **Check MongoDB is listening**:
   ```powershell
   netstat -an | findstr "27017"
   ```

3. **Test connection with MongoDB Compass**:
   - Open MongoDB Compass
   - Connect to `mongodb://localhost:27017`

### OpenAI API Issues

1. **Verify your API key** is valid and has credits
2. **Check for rate limits** - If you see 429 errors, wait and try again
3. **Ensure the API key** is correctly set in `.env`

### Port Already in Use

If port 5000 is busy:
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

1. **Ensure the PDF contains text** (not scanned images)
2. **Check file size** - Keep it under 10MB
3. **Try a different PDF** if one fails

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

# Database operations (PostgreSQL only)
npm run db:push    # Push schema changes
npm run db:studio  # Open Drizzle Studio
```

### Adding New Features

1. Define types in `shared/schema.ts`
2. Add storage methods in `server/storage.ts` (or `server/local/storage-mongo.ts` for MongoDB)
3. Create API routes in `server/routes.ts`
4. Build frontend components in `client/src/`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is open source and available under the MIT License.

---

## Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Open an issue on GitHub
3. Review the console logs for error messages

Happy learning with SkillWise!
