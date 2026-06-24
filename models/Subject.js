const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    subjectType: {
      type: String,
      enum: ['mandatory', 'optional', 'practical'],
      default: 'mandatory',
    },
    isHifzSubject: {
      type: Boolean,
      default: false,
    },
    classLevels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassLevel',
      },
    ],
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

module.exports = mongoose.model('Subject', subjectSchema);
