import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let mongoConnection = null;

export const connectToDatabases = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }

    // Connect to MongoDB with Azure Cosmos DB
    mongoConnection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: false,
      appName: 'synap-events-app',
      dbName: process.env.MONGODB_DB || 'synap_events',
      ssl: true,
      sslValidate: true,
      sslCA: process.env.MONGODB_CA_PATH || undefined,
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connection has been established successfully.');
    
    // Log MongoDB connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from DB');
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1); // Exit process with failure
  }
};

export const getMongoConnection = () => {
  if (!mongoConnection) {
    throw new Error('MongoDB connection not established. Call connectToDatabases() first.');
  }
  return mongoConnection;
};

export const closeDatabaseConnections = async () => {
  try {
    if (mongoConnection) {
      await mongoose.connection.close(true);
      mongoConnection = null;
      logger.info('MongoDB connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
    throw error;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnections();
  process.exit(0);
});
