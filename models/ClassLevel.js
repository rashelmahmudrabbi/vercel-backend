const mongoose = require('mongoose');

const classLevelSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'শ্রেণির নাম আবশ্যক'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'শ্রেণি কোড আবশ্যক'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    educationStream: {
      type: String,
      enum: ['general', 'hifz'],
      default: 'general',
    },
    monthlyFee: {
      type: Number,
      default: 0,
    },
    admissionFee: {
      type: Number,
      default: 0,
    },
    sessionFee: {
      type: Number,
      default: 0,
    },
    examFee: {
      type: Number,
      default: 0,
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

classLevelSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('ClassLevel', classLevelSchema);
