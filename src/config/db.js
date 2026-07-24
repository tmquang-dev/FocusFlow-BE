import mongoose from 'mongoose';
import User from '../models/user.model.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Tự động đồng bộ hóa & cập nhật lại index trong MongoDB
    await User.syncIndexes();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    throw error;
  }
};


export default connectDB;
