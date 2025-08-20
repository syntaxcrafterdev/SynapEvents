import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './middleware/errorHandler.js';
import { connectToDatabases } from './config/database.js';
import { configureRoutes } from './routes/index.js';
import { setupSwagger } from './config/swagger.js';
import { configureWebSockets } from './services/socketService.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimiter);

// Initialize database connections
await connectToDatabases();

// Configure Swagger documentation
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// Configure routes
configureRoutes(app);

// Configure WebSockets
configureWebSockets(io);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err}`);
  // Close server & exit process
  httpServer.close(() => process.exit(1));
});

export { app, httpServer };
