const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'প্রতিষ্ঠানের নাম আবশ্যক'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'প্রতিষ্ঠান কোড আবশ্যক'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    establishedDate: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka',
    },
    defaultLanguage: {
      type: String,
      default: 'bn',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Institution', institutionSchema);
