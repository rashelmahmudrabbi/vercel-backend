const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'অন্যান্য',
    },
    copies: {
      type: Number,
      required: true,
      default: 1,
    },
    available: {
      type: Number,
      required: true,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Book', bookSchema);
