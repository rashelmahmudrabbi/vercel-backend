const StudentAttendance = require('../models/StudentAttendance');
const ApiResponse = require('../utils/apiResponse');

// Helper: date string থেকে UTC start/end of day তৈরি করা
const getDayRange = (dateStr) => {
  // dateStr format: 'YYYY-MM-DD'
  const start = new Date(dateStr + 'T00:00:00.000Z');
  const end = new Date(dateStr + 'T23:59:59.999Z');
  return { start, end };
};

// @desc    ছাত্রদের উপস্থিতি রেকর্ড করা
// @route   POST /api/v1/attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { date, classLevel, section, students } = req.body;
    // students: [{ studentId, status, remarks }]

    if (!date || !students || students.length === 0) {
      return ApiResponse.error(res, 'তারিখ এবং ছাত্র তালিকা প্রয়োজন', 400);
    }

    // Store date as UTC start of day to avoid timezone issues
    const targetDate = new Date(date + 'T00:00:00.000Z');

    const attendanceRecords = students.map((s) => ({
      institution: req.user.institution,
      student: s.studentId,
      classLevel,
      section,
      date: targetDate,
      status: s.status,
      remarks: s.remarks || '',
      markedBy: req.user._id,
    }));

    // Use bulk write to update or insert (upsert)
    const bulkOps = attendanceRecords.map((record) => ({
      updateOne: {
        filter: { student: record.student, date: targetDate },
        update: { $set: record },
        upsert: true,
      },
    }));

    await StudentAttendance.bulkWrite(bulkOps);

    ApiResponse.success(res, { count: students.length }, 'উপস্থিতি সফলভাবে রেকর্ড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    একটি নির্দিষ্ট দিনের ক্লাসের উপস্থিতি দেখা
// @route   GET /api/v1/attendance
exports.getAttendance = async (req, res, next) => {
  try {
    const { date, classLevel, section } = req.query;

    const filter = {
      institution: req.user.institution,
    };

    if (date) {
      // Use range query to avoid timezone mismatch issues
      const { start, end } = getDayRange(date);
      filter.date = { $gte: start, $lte: end };
    }

    if (classLevel) filter.classLevel = classLevel;
    // single section
    if (section) filter.section = section;
    // multiple sections (comma-separated)
    if (req.query.sections) {
      const secIds = req.query.sections.split(',').filter(Boolean);
      filter.section = { $in: secIds };
    }

    const records = await StudentAttendance.find(filter)
      .populate({
        path: 'student',
        select: 'studentId user',
        populate: { path: 'user', select: 'firstName lastName fullName' },
      })
      .populate('markedBy', 'firstName lastName fullName');

    ApiResponse.success(res, { records });
  } catch (error) {
    next(error);
  }
};
