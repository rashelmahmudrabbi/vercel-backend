const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
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
    admissionNumber: {
      type: String,
      required: [true, 'ভর্তি নম্বর আবশ্যক'],
      unique: true,
    },
    studentId: {
      type: String,
      required: [true, 'ছাত্র আইডি আবশ্যক'],
      unique: true,
    },
    currentEnrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentEnrollment',
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['পুরুষ', 'মহিলা', ''],
      default: '',
    },
    residentialStatus: {
      type: String,
      enum: ['residential', 'non-residential', 'day-care', ''],
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    photo: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred', 'suspended'],
      default: 'active',
      index: true,
    },
    admissionDate: {
      type: Date,
      required: [true, 'ভর্তির তারিখ আবশ্যক'],
    },
    admissionSource: {
      type: String,
      default: '',
    },
    previousInstitution: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.index({ institution: 1, branch: 1, status: 1 });

studentSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model('Student', studentSchema);
