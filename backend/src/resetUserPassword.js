import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const users = await User.find();
    console.log('Found users:', users.length);
    for (const u of users) {
      u.password = 'password123';
      await u.save();
      console.log(`Successfully reset password for: ${u.email} (${u.role}) to: password123`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

reset();
