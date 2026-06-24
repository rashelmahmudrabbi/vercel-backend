const Exam = require('../models/Exam');
const MarkEntry = require('../models/MarkEntry');
const AcademicYear = require('../models/AcademicYear');
const ApiResponse = require('../utils/apiResponse');

// @desc    সকল পরীক্ষা তালিকা
// @route   GET /api/v1/exams
exports.getExams = async (req, res, next) => {
  try {
    const filter = { institution: req.user.institution };
    if (req.query.status) filter.status = req.query.status;

    const exams = await Exam.find(filter)
      .populate('classLevel', 'name code')
      .sort({ startDate: -1 });

    ApiResponse.success(res, { exams });
  } catch (error) {
    next(error);
  }
};

// @desc    নতুন পরীক্ষা তৈরি
// @route   POST /api/v1/exams
exports.createExam = async (req, res, next) => {
  try {
    const { name, classLevel, startDate, endDate, status } = req.body;

    if (!name) {
      return ApiResponse.error(res, 'পরীক্ষার নাম আবশ্যক', 400);
    }

    let academicYear = await AcademicYear.findOne({ institution: req.user.institution, isCurrent: true });
    if (!academicYear) {
      academicYear = await AcademicYear.findOne({ institution: req.user.institution });
    }

    const exam = await Exam.create({
      institution: req.user.institution,
      academicYear: academicYear ? academicYear._id : null,
      name,
      classLevel: classLevel || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'upcoming',
    });

    const populated = await Exam.findById(exam._id).populate('classLevel', 'name code');

    ApiResponse.created(res, { exam: populated }, 'পরীক্ষা সফলভাবে তৈরি হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    নম্বর এন্ট্রি দেখা
// @route   GET /api/v1/exams/marks
exports.getMarks = async (req, res, next) => {
  try {
    const filter = { institution: req.user.institution };
    
    if (req.query.exam) filter.exam = req.query.exam;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.student) filter.student = req.query.student;

    const marks = await MarkEntry.find(filter)
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name')
      .populate('exam', 'name');

    ApiResponse.success(res, { marks });
  } catch (error) {
    next(error);
  }
};

// @desc    নম্বর এন্ট্রি করা বা আপডেট করা
// @route   POST /api/v1/exams/marks
exports.saveMarks = async (req, res, next) => {
  try {
    const { exam, subject, marks } = req.body;
    // marks is an array: [{ studentId, marksObtained }]

    const markRecords = marks.map((m) => {
      let grade = 'F';
      if (m.marksObtained >= 80) grade = 'A+';
      else if (m.marksObtained >= 70) grade = 'A';
      else if (m.marksObtained >= 60) grade = 'A-';
      else if (m.marksObtained >= 50) grade = 'B';
      else if (m.marksObtained >= 40) grade = 'C';
      else if (m.marksObtained >= 33) grade = 'D';

      return {
        institution: req.user.institution,
        exam,
        subject,
        student: m.studentId,
        marksObtained: m.marksObtained,
        grade,
        enteredBy: req.user._id,
      };
    });

    const bulkOps = markRecords.map((record) => ({
      updateOne: {
        filter: { exam: record.exam, student: record.student, subject: record.subject },
        update: { $set: record },
        upsert: true,
      },
    }));

    await MarkEntry.bulkWrite(bulkOps);

    ApiResponse.success(res, null, 'নম্বর সফলভাবে সংরক্ষণ করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    পরীক্ষা আপডেট
// @route   PATCH /api/v1/exams/:id
exports.updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true, runValidators: true }
    ).populate('classLevel', 'name code');

    if (!exam) {
      return ApiResponse.notFound(res, 'পরীক্ষা পাওয়া যায়নি');
    }

    ApiResponse.success(res, { exam }, 'পরীক্ষা সফলভাবে আপডেট করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    পরীক্ষা মুছে ফেলা
// @route   DELETE /api/v1/exams/:id
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });

    if (!exam) {
      return ApiResponse.notFound(res, 'পরীক্ষা পাওয়া যায়নি');
    }

    // Associated marks also need to be deleted
    await MarkEntry.deleteMany({ exam: req.params.id });

    ApiResponse.success(res, null, 'পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে');
  } catch (error) {
    next(error);
  }
};
