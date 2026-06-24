const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    classLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassLevel',
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'রোল নম্বর আবশ্যক'],
    },
    enrollmentStatus: {
      type: String,
      enum: ['active', 'completed', 'promoted', 'transferred'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studentEnrollmentSchema.index(
  { academicYear: 1, classLevel: 1, section: 1, rollNumber: 1 },
  { unique: true }
);
studentEnrollmentSchema.index({ student: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('StudentEnrollment', studentEnrollmentSchema);
