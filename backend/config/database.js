const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
      return;
    } catch (error) {
      console.error(`MongoDB connection error (attempt ${retries + 1}):`, error);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
  console.error('Failed to connect to MongoDB after multiple attempts');
  process.exit(1);
}

module.exports = connectDB;