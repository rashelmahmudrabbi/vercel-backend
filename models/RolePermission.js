const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
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
    },
    permissions: {
      // Homework
      can_view_homework: { type: Boolean, default: true },
      can_create_homework: { type: Boolean, default: false },
      can_edit_homework: { type: Boolean, default: false },
      can_delete_homework: { type: Boolean, default: false },
      
      // Attendance
      can_view_attendance: { type: Boolean, default: true },
      can_mark_attendance: { type: Boolean, default: false },
      
      // Exams
      can_view_exams: { type: Boolean, default: true },
      can_manage_exams: { type: Boolean, default: false },
      
      // Finance
      can_view_finance: { type: Boolean, default: false },
      can_manage_finance: { type: Boolean, default: false },
      
      // Users
      can_view_users: { type: Boolean, default: false },
      can_manage_users: { type: Boolean, default: false },

      // Notice
      can_view_notice: { type: Boolean, default: true },
      can_manage_notice: { type: Boolean, default: false },

      // Teacher Specific
      can_grade_exams: { type: Boolean, default: false },
      can_add_syllabus: { type: Boolean, default: false },
      can_communicate_parents: { type: Boolean, default: false },
      can_take_live_class: { type: Boolean, default: false },

      // Reports
      can_view_reports: { type: Boolean, default: false },
      
      // Hifz Management
      can_manage_hifz: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
