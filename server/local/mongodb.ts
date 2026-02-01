import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error("========================================");
    console.error("ERROR: MONGODB_URI environment variable is not set!");
    console.error("");
    console.error("To run this application, you need a MongoDB database.");
    console.error("");
    console.error("Option 1: MongoDB Atlas (Free Cloud Database)");
    console.error("  1. Go to https://www.mongodb.com/atlas");
    console.error("  2. Create a free account and cluster");
    console.error("  3. Create a database user");
    console.error("  4. Allow network access from anywhere");
    console.error("  5. Get your connection string");
    console.error("");
    console.error("Option 2: Local MongoDB (Windows/Mac/Linux)");
    console.error("  1. Install MongoDB Community Server");
    console.error("  2. Use: mongodb://localhost:27017/skillwise");
    console.error("");
    console.error("Then set MONGODB_URI in your environment/secrets.");
    console.error("========================================");
    throw new Error("MONGODB_URI environment variable is required");
  }
  
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) return;
  
  await mongoose.disconnect();
  isConnected = false;
  console.log("Disconnected from MongoDB");
}

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
});

process.on("SIGINT", async () => {
  await disconnectMongoDB();
  process.exit(0);
});
