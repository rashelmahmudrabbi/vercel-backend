require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Register models
require('./models/Institution');
require('./models/Branch');
require('./models/AcademicYear');
require('./models/ClassLevel');
require('./models/Section');
require('./models/User');
require('./models/Student');
require('./models/StudentEnrollment');
require('./models/Teacher');
require('./models/Guardian');
require('./models/Subject');
require('./models/StudentAttendance');
require('./models/Homework');
require('./models/HomeworkSubmission');
require('./models/RolePermission');

require('./models/Exam');
require('./models/MarkEntry');
require('./models/HifzDailyProgress');

require('./models/Invoice');
require('./models/Payment');
require('./models/Notice');
require('./models/TeacherAttendance');
require('./models/Book');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const guardianRoutes = require('./routes/guardians');
const attendanceRoutes = require('./routes/attendance');
const homeworkRoutes = require('./routes/homework');
const examRoutes = require('./routes/exams');
const hifzRoutes = require('./routes/hifz');
const financeRoutes = require('./routes/finance');
const noticeRoutes = require('./routes/notices');
const rolePermissionRoutes = require('./routes/rolePermission');
const reportRoutes = require('./routes/reports');
const bookRoutes = require('./routes/books');


const app = express();

// মিডলওয়্যার
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use((req, res, next) => {
  try {
    const fs = require('fs');
    fs.appendFileSync('C:\\Users\\Nazmul\\.gemini\\antigravity-ide\\brain\\87dd51c6-8e83-4392-aad8-4cfdb121e2fc\\request_log.txt', `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`);
  } catch (e) {}
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// রাউট
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'সার্ভার চালু আছে ✅', timestamp: new Date() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/guardians', guardianRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/homework', homeworkRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/hifz', hifzRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/permissions', rolePermissionRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/books', bookRoutes);


// ৪০৪ হ্যান্ডলার
app.use((req, res) => {
  res.status(404).json({ success: false, message: `${req.originalUrl} — এই রাউট পাওয়া যায়নি` });
});

// এরর হ্যান্ডলার
app.use(errorHandler);

// সার্ভার চালু
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  
  // Start Monthly Invoice Auto-Scheduler
  const { startInvoiceScheduler } = require('./utils/invoiceScheduler');
  startInvoiceScheduler();

  app.listen(PORT, () => {
    console.log(`🚀  সার্ভার চালু হয়েছে পোর্ট ${PORT} এ`);
    console.log(`📍 http://localhost:${PORT}/api/v1/health`);
  });
};

start();
