const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const StudentAttendance = require('../models/StudentAttendance');
const Exam = require('../models/Exam');
const MarkEntry = require('../models/MarkEntry');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const ClassLevel = require('../models/ClassLevel');
const ApiResponse = require('../utils/apiResponse');

// @desc    Aggregated reports summary
// @route   GET /api/v1/reports/summary
// @access  Private (users with can_view_reports)
exports.getSummary = async (req, res, next) => {
  const fs = require('fs');
  const log = (msg) => {
    try { fs.appendFileSync('C:\\Users\\Nazmul\\.gemini\\antigravity-ide\\brain\\87dd51c6-8e83-4392-aad8-4cfdb121e2fc\\get_summary_debug.txt', `${new Date().toISOString()} - ${msg}\n`); } catch(e) {}
  };
  try {
    log("Started getSummary");
    const instFilter = req.user.institution ? { institution: req.user.institution } : {};
    log(`instFilter: ${JSON.stringify(instFilter)}`);

    // ── Students ──────────────────────────────────────────────
    log("Querying totalStudents");
    const totalStudents = await Student.countDocuments({ ...instFilter, isDeleted: { $ne: true } });
    log(`totalStudents: ${totalStudents}`);
    log("Querying activeStudents");
    const activeStudents = await Student.countDocuments({ ...instFilter, status: 'active', isDeleted: { $ne: true } });
    log(`activeStudents: ${activeStudents}`);
    log("Querying inactiveStudents");
    const inactiveStudents = await Student.countDocuments({ ...instFilter, status: 'inactive', isDeleted: { $ne: true } });
    log(`inactiveStudents: ${inactiveStudents}`);
    log("Querying maleStudents");
    const maleStudents = await Student.countDocuments({ ...instFilter, gender: 'male', isDeleted: { $ne: true } });
    log(`maleStudents: ${maleStudents}`);
    log("Querying femaleStudents");
    const femaleStudents = await Student.countDocuments({ ...instFilter, gender: 'female', isDeleted: { $ne: true } });
    log(`femaleStudents: ${femaleStudents}`);

    // Students per class
    log("Querying studentsByClass aggregate");
    const studentsByClass = await Student.aggregate([
      { $match: { ...instFilter, isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'studentenrollments',
          localField: 'currentEnrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: { path: '$enrollment', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'classlevels',
          localField: 'enrollment.classLevel',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { classId: '$classInfo._id', className: '$classInfo.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.className': 1 } }
    ]);
    log(`studentsByClass count: ${studentsByClass.length}`);

    // ── Teachers ──────────────────────────────────────────────
    log("Querying teachers");
    const totalTeachers = await Teacher.countDocuments(instFilter);
    const activeTeachers = await Teacher.countDocuments({ ...instFilter, status: 'active' });
    const regularTeachers = await Teacher.countDocuments({ ...instFilter, teacherType: 'regular' });
    const hifzTeachers = await Teacher.countDocuments({ ...instFilter, teacherType: 'hifz' });
    log(`teachers count: total=${totalTeachers}, active=${activeTeachers}`);

    // ── Attendance ─────────────────────────────────────────────
    log("Querying attendance");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayAttendanceRecords = await StudentAttendance.find({
      date: { $gte: today, $lt: tomorrow }
    });
    const todayPresent = todayAttendanceRecords.filter(r => r.status === 'present').length;
    const todayAbsent = todayAttendanceRecords.filter(r => r.status === 'absent').length;
    const todayLate = todayAttendanceRecords.filter(r => r.status === 'late').length;
    const todayTotal = todayAttendanceRecords.length;
    log(`todayAttendance: total=${todayTotal}, present=${todayPresent}`);

    // This month attendance rate
    log("Querying monthAttendance");
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAttendance = await StudentAttendance.aggregate([
      { $match: { date: { $gte: monthStart, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      }
    ]);
    const monthStats = monthAttendance[0] || { total: 0, present: 0, absent: 0, late: 0 };
    log(`monthStats: total=${monthStats.total}, present=${monthStats.present}`);

    // ── Exams ──────────────────────────────────────────────────
    log("Querying exams");
    const totalExams = await Exam.countDocuments(instFilter);
    const upcomingExams = await Exam.countDocuments({ ...instFilter, status: 'upcoming' });
    const completedExams = await Exam.countDocuments({ ...instFilter, status: { $in: ['completed', 'published'] } });
    const ongoingExams = await Exam.countDocuments({ ...instFilter, status: 'ongoing' });
    log(`exams: total=${totalExams}`);

    // Grade distribution from all mark entries
    log("Querying gradeDistribution");
    const gradeDistribution = await MarkEntry.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          avgMarks: { $avg: '$marksObtained' },
          passCount: { $sum: { $cond: [{ $gte: ['$marksObtained', 33] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $lt: ['$marksObtained', 33] }, 1, 0] } },
          aPlus: { $sum: { $cond: [{ $gte: ['$marksObtained', 80] }, 1, 0] } },
          a: { $sum: { $cond: [{ $and: [{ $gte: ['$marksObtained', 70] }, { $lt: ['$marksObtained', 80] }] }, 1, 0] } },
          aMinus: { $sum: { $cond: [{ $and: [{ $gte: ['$marksObtained', 60] }, { $lt: ['$marksObtained', 70] }] }, 1, 0] } },
          b: { $sum: { $cond: [{ $and: [{ $gte: ['$marksObtained', 50] }, { $lt: ['$marksObtained', 60] }] }, 1, 0] } },
          c: { $sum: { $cond: [{ $and: [{ $gte: ['$marksObtained', 40] }, { $lt: ['$marksObtained', 50] }] }, 1, 0] } },
          d: { $sum: { $cond: [{ $and: [{ $gte: ['$marksObtained', 33] }, { $lt: ['$marksObtained', 40] }] }, 1, 0] } },
        }
      }
    ]);
    const grades = gradeDistribution[0] || { totalEntries: 0, avgMarks: 0, passCount: 0, failCount: 0, aPlus: 0, a: 0, aMinus: 0, b: 0, c: 0, d: 0 };
    log(`grades: totalEntries=${grades.totalEntries}`);

    // ── Finance ────────────────────────────────────────────────
    log("Querying finance");
    const totalInvoiced = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalPaid = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const invoicedAmount = totalInvoiced[0]?.total || 0;
    const paidAmount = totalPaid[0]?.total || 0;
    const outstandingAmount = invoicedAmount - paidAmount;
    log(`finance: invoiced=${invoicedAmount}, paid=${paidAmount}`);

    // Recent exams list (up to 5)
    log("Querying recentExams");
    const recentExams = await Exam.find(instFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('classLevel', 'name');
    log(`recentExams: ${recentExams.length}`);

    log("Sending success response");
    ApiResponse.success(res, {
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        male: maleStudents,
        female: femaleStudents,
        byClass: studentsByClass.map(s => ({
          className: s._id.className || 'অজানা',
          count: s.count
        }))
      },
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
        regular: regularTeachers,
        hifz: hifzTeachers
      },
      attendance: {
        today: {
          total: todayTotal,
          present: todayPresent,
          absent: todayAbsent,
          late: todayLate,
          rate: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0
        },
        thisMonth: {
          total: monthStats.total,
          present: monthStats.present,
          absent: monthStats.absent,
          late: monthStats.late,
          rate: monthStats.total > 0 ? Math.round((monthStats.present / monthStats.total) * 100) : 0
        }
      },
      exams: {
        total: totalExams,
        upcoming: upcomingExams,
        ongoing: ongoingExams,
        completed: completedExams,
        gradeDistribution: {
          totalEntries: grades.totalEntries,
          avgMarks: grades.avgMarks ? Math.round(grades.avgMarks * 10) / 10 : 0,
          passCount: grades.passCount,
          failCount: grades.failCount,
          aPlus: grades.aPlus,
          a: grades.a,
          aMinus: grades.aMinus,
          b: grades.b,
          c: grades.c,
          d: grades.d,
        },
        recent: recentExams
      },
      finance: {
        invoiced: invoicedAmount,
        paid: paidAmount,
        outstanding: outstandingAmount,
        collectionRate: invoicedAmount > 0 ? Math.round((paidAmount / invoicedAmount) * 100) : 0
      },
      generatedAt: new Date()
    });
  } catch (error) {
    try {
      fs.appendFileSync('C:\\Users\\Nazmul\\.gemini\\antigravity-ide\\brain\\87dd51c6-8e83-4392-aad8-4cfdb121e2fc\\get_summary_debug.txt', `${new Date().toISOString()} - ERROR in getSummary: ${error.message}\n${error.stack}\n`);
    } catch(e) {}
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// @desc    Individual student attendance for a month
// @route   GET /api/v1/reports/student-attendance
// @access  Private
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId, month, year } = req.query;
    if (!studentId) return ApiResponse.error(res, 'ছাত্র আইডি প্রয়োজন', 400);

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const records = await StudentAttendance.find({
      student: studentId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const summary = { present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0, total: records.length };
    records.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });

    // Get student name
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');

    ApiResponse.success(res, {
      student: student ? {
        _id: student._id,
        name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'অজানা',
        studentId: student.studentId
      } : null,
      month: m,
      year: y,
      records: records.map(r => ({
        date: r.date,
        status: r.status,
        remarks: r.remarks
      })),
      summary
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// @desc    Individual teacher attendance for a month
// @route   GET /api/v1/reports/teacher-attendance
// @access  Private
exports.getTeacherAttendance = async (req, res, next) => {
  try {
    const TeacherAttendance = require('../models/TeacherAttendance');
    const { teacherId, month, year } = req.query;
    if (!teacherId) return ApiResponse.error(res, 'শিক্ষক আইডি প্রয়োজন', 400);

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const records = await TeacherAttendance.find({
      teacher: teacherId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const summary = { present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0, total: records.length };
    records.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });

    const teacher = await Teacher.findById(teacherId).populate('user', 'firstName lastName');

    ApiResponse.success(res, {
      teacher: teacher ? {
        _id: teacher._id,
        name: teacher.user ? `${teacher.user.firstName} ${teacher.user.lastName}` : 'অজানা',
        employeeId: teacher.employeeId
      } : null,
      month: m,
      year: y,
      records: records.map(r => ({
        date: r.date,
        status: r.status,
        remarks: r.remarks
      })),
      summary
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// @desc    Individual student marks per exam
// @route   GET /api/v1/reports/student-marks
// @access  Private
exports.getStudentMarks = async (req, res, next) => {
  try {
    const { studentId, examId } = req.query;
    if (!studentId) return ApiResponse.error(res, 'ছাত্র আইডি প্রয়োজন', 400);

    const filter = { student: studentId };
    if (examId) filter.exam = examId;

    const marks = await MarkEntry.find(filter)
      .populate('exam', 'name startDate status')
      .populate('subject', 'name code')
      .sort({ 'exam.startDate': -1 });

    // Group by exam
    const examMap = {};
    marks.forEach(m => {
      const eid = m.exam?._id?.toString() || 'unknown';
      if (!examMap[eid]) {
        examMap[eid] = {
          exam: m.exam ? { _id: m.exam._id, name: m.exam.name, status: m.exam.status } : null,
          subjects: [],
          totalMarks: 0,
          totalObtained: 0
        };
      }
      examMap[eid].subjects.push({
        subject: m.subject ? { name: m.subject.name, code: m.subject.code } : { name: 'অজানা' },
        marksObtained: m.marksObtained,
        totalMarks: m.totalMarks,
        grade: m.grade,
        percentage: m.totalMarks > 0 ? Math.round((m.marksObtained / m.totalMarks) * 100) : 0
      });
      examMap[eid].totalMarks += m.totalMarks;
      examMap[eid].totalObtained += m.marksObtained;
    });

    const student = await Student.findById(studentId).populate('user', 'firstName lastName');

    ApiResponse.success(res, {
      student: student ? {
        _id: student._id,
        name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'অজানা',
        studentId: student.studentId
      } : null,
      examResults: Object.values(examMap).map(e => ({
        ...e,
        overallPercentage: e.totalMarks > 0 ? Math.round((e.totalObtained / e.totalMarks) * 100) : 0
      }))
    });
  } catch (error) {
    next(error);
  }
};
