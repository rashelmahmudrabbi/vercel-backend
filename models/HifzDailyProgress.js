const mongoose = require('mongoose');

const hifzProgressSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    sabaq: {
      type: String,
      required: true,
    },
    sabqi: {
      type: String,
    },
    manzil: {
      type: String,
    },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor'],
      default: 'good',
    },
    mistakesCount: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

hifzProgressSchema.index({ student: 1, date: 1 });

module.exports = mongoose.model('HifzDailyProgress', hifzProgressSchema);
