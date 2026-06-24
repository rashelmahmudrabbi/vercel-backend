const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB সংযুক্ত হয়েছে: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB সংযোগ ব্যর্থ: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
