const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
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
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    fineTotal: {
      type: Number,
      default: 0,
    },
    payableTotal: {
      type: Number,
      required: true,
    },
    paidTotal: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'cancelled'],
      default: 'unpaid',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
