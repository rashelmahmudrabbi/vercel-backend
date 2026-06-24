const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'প্রতিষ্ঠান আবশ্যক'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'শাখার নাম আবশ্যক'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'শাখা কোড আবশ্যক'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
    },
    head: {
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

branchSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
