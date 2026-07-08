import mongoose from 'mongoose';

let mongoServer;

const connectDB = async () => {
  try {
    // Attempt standard connection with a short timeout to fail fast if MongoDB is not running
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.log('\n[Database Fallback] Failed to connect to primary MongoDB database. Spinning up in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        console.log(`In-memory MongoDB instance started at: ${mongoUri}`);
        
        const conn = await mongoose.connect(mongoUri);
        console.log(`Connected to fallback in-memory MongoDB: ${conn.connection.host}`);
      } catch (fallbackError) {
        console.error(`Failed to start in-memory MongoDB: ${fallbackError.message}`);
        console.log('WARNING: Express server is running, but database connection failed.');
      }
    } else {
      console.log('WARNING: Express server is running, but database connection failed.');
    }
  }
};

// Graceful cleanup
process.on('SIGINT', async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
  await mongoose.disconnect();
  process.exit(0);
});

export default connectDB;

