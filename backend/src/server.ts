import express from "express";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import { createServer } from "http";
import { connectDB } from "./config/database.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initializeSocket } from "./utils/socket.js";

const app = express();

const PORT = process.env.PORT || 9000;

const allowedOrigins = [
  process.env.FRONTEND_DEVELOPMENT_URL as string,
  process.env.MOBILE_DEVELOPMENT_URL as string,
  process.env.FRONTEND_PRODUCTION_URL as string,
].filter(Boolean) as string[];

// middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow credentials from client (cookies, authorization headers, etc.)
  }),
);
app.use(clerkMiddleware());
app.use(express.json()); // parses incoming JSON requests  bodies and makes them available under req.body

// routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Error handler middleware should be last middleware so that it can catch errors from next(error)
app.use(errorHandler);

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// wraps the express app
const httpServer = createServer(app);
initializeSocket(httpServer);

// start the server
const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
