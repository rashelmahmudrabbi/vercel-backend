const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'শিক্ষাবর্ষের নাম আবশ্যক'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'শুরুর তারিখ আবশ্যক'],
    },
    endDate: {
      type: Date,
      required: [true, 'শেষের তারিখ আবশ্যক'],
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

academicYearSchema.index({ institution: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
