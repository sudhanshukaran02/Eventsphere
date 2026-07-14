import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event.js';
import User from './models/User.js';
import seedDB from './utils/seeder.js';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const users = await User.find();
    console.log('Users count:', users.length);
    console.log('Users:', users.map(u => ({ email: u.email, role: u.role })));

    const events = await Event.find();
    console.log('Events count:', events.length);
    
    if (events.length === 0) {
      console.log('Running seeder manually...');
      await seedDB();
      const updatedEvents = await Event.find();
      console.log('Updated events count:', updatedEvents.length);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

check();
