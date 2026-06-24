const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'পাসওয়ার্ড আবশ্যক'],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    userType: {
      type: String,
      enum: [
        'super_admin',
        'co_super_admin',
        'admin',
        'principal',
        'vice_principal',
        'teacher',
        'hifz_teacher',
        'accountant',
        'admission_officer',
        'hostel_manager',
        'library_manager',
        'student',
        'guardian',
      ],
      required: [true, 'ব্যবহারকারীর ধরন আবশ্যক'],
      index: true,
    },
    adminRole: {
      type: String,
      enum: ['admin', 'co_super_admin', ''],
      default: '',
      index: true,
    },
    photo: {
      type: String,
      default: '',
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim() || this.username;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ institution: 1, branch: 1 });
userSchema.index({ userType: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);
