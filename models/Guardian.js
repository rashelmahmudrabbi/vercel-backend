const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    guardianId: {
      type: String,
      required: true,
      unique: true,
    },
    occupation: {
      type: String,
    },
    nationalId: {
      type: String,
    },
    relationshipLabel: {
      type: String,
      default: 'পিতা/মাতা',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
        },
        relationship: {
          type: String,
          default: 'পিতা',
        },
        isPrimary: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Guardian', guardianSchema);
