const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    classLevel: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Teacher
      required: true,
    },
    assignDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    attachments: [
      {
        url: String,
        name: String,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'draft', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Homework', homeworkSchema);
