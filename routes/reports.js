const express = require('express');
const router = express.Router();
const { getSummary, getStudentAttendance, getTeacherAttendance, getStudentMarks } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/student-attendance', getStudentAttendance);
router.get('/teacher-attendance', getTeacherAttendance);
router.get('/student-marks', getStudentMarks);

module.exports = router;
