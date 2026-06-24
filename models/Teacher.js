const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    teacherType: {
      type: String,
      enum: ['regular', 'hifz', 'guest'],
      default: 'regular',
    },
    joiningDate: {
      type: Date,
    },
    qualification: {
      type: String,
    },
    specialization: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'resigned', 'terminated'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Teacher', teacherSchema);
