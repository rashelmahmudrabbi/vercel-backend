const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// @desc    সকল ব্যবহারকারীর তালিকা
// @route   GET /api/v1/users
router.get('/', authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.institution) filter.institution = req.user.institution;
    if (req.query.userType) {
      if (req.query.userType === 'staff') {
        filter.userType = { $nin: ['student', 'guardian'] };
      } else {
        filter.userType = req.query.userType;
      }
    }
    if (req.query.search) {
      const s = new RegExp(req.query.search, 'i');
      filter.$or = [{ username: s }, { email: s }, { firstName: s }, { lastName: s }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('institution', 'name code')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    ApiResponse.paginated(res, users, page, limit, total);
  } catch (error) {
    next(error);
  }
});

// @desc    ব্যবহারকারীর বিস্তারিত
// @route   GET /api/v1/users/:id
router.get('/:id', authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('institution', 'name code')
      .populate('branch', 'name code');

    if (!user) return ApiResponse.notFound(res, 'ব্যবহারকারী পাওয়া যায়নি');
    ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
});

// @desc    ব্যবহারকারীর রোল পরিবর্তন (Promote/Demote)
// @route   PATCH /api/v1/users/:id/role
// @access  Private (Super Admin and Co-Super Admin only)
router.patch('/:id/role', authorize('super_admin', 'co_super_admin'), async (req, res, next) => {
  try {
    const { newRole } = req.body; // 'admin', 'co_super_admin', or ''
    if (newRole === undefined) {
      return ApiResponse.error(res, 'নতুন রোল (newRole) প্রদান করা আবশ্যক', 400);
    }

    if (newRole !== '' && !['admin', 'co_super_admin'].includes(newRole)) {
      return ApiResponse.error(res, 'ভুল রোল নির্বাচন করা হয়েছে', 400);
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return ApiResponse.notFound(res, 'ব্যবহারকারী পাওয়া যায়নি');
    }

    // Cannot demote or edit the super_admin
    if (targetUser.userType === 'super_admin') {
      return ApiResponse.error(res, 'সুপার অ্যাডমিনের রোল পরিবর্তন করা সম্ভব নয়', 403);
    }

    // Co-Super Admin cannot demote/edit a Co-Super Admin (either by userType or adminRole)
    const isTargetCoSuper = targetUser.userType === 'co_super_admin' || targetUser.adminRole === 'co_super_admin';
    const isRequesterSuper = req.user.userType === 'super_admin';
    if (isTargetCoSuper && !isRequesterSuper) {
      return ApiResponse.error(res, 'কো-সুপার অ্যাডমিনের রোল পরিবর্তন করার ক্ষমতা শুধুমাত্র সুপার অ্যাডমিনের রয়েছে', 403);
    }

    const oldRole = targetUser.adminRole || 'none';
    targetUser.adminRole = newRole;
    await targetUser.save();

    ApiResponse.success(
      res,
      { user: targetUser },
      `ব্যবহারকারীর অতিরিক্ত রোল সফলভাবে '${oldRole}' থেকে '${newRole || 'none'}' এ পরিবর্তন করা হয়েছে`
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
