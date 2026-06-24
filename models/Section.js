const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
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
    classLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassLevel',
      required: [true, 'শ্রেণি আবশ্যক'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'শাখার নাম আবশ্যক'],
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

sectionSchema.index({ classLevel: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
