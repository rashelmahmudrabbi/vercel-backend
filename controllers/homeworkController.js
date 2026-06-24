const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Subject = require('../models/Subject');
const ApiResponse = require('../utils/apiResponse');

// @desc    সকল হোমওয়ার্ক তালিকা
// @route   GET /api/v1/homework
exports.getHomeworks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const filter = {};
    // super_admin হলে institution ফিল্টার প্রযোজ্য হবে না (সব দেখতে পারবে)
    if (req.user.userType !== 'super_admin' && req.user.institution) {
      filter.institution = req.user.institution;
    }
    
    console.log('GET /homework - UserType:', req.user.userType, 'Institution:', req.user.institution);
    console.log('GET /homework - Filter before query:', filter);
    
    // ফিল্টার: classLevel, section, subject
    if (req.query.classLevel) filter.classLevel = req.query.classLevel;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.status) filter.status = req.query.status;

    // ডেট ফিল্টার
    if (req.query.dateFilter === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      filter.assignDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (req.query.dateFilter && req.query.dateFilter !== 'all') {
      const selectedDate = new Date(req.query.dateFilter);
      if (!isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.assignDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // সার্চ ফিল্টার
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex }
      ];
    }

    // যদি ব্যবহারকারী ছাত্র হয়, তবে শুধু তার ক্লাসের হোমওয়ার্ক দেখাবে
    if (req.user.userType === 'student') {
      // Note: Ideally, we should fetch student's current class/section from enrollment
      // For now, we return active homeworks based on frontend filter
      filter.status = 'active';
    }

    const total = await Homework.countDocuments(filter);
    const homeworks = await Homework.find(filter)
      .populate('assignedBy', 'firstName lastName fullName')
      .sort({ assignDate: -1 })
      .skip(skip)
      .limit(limit);

    ApiResponse.paginated(res, homeworks, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    নতুন হোমওয়ার্ক তৈরি
// @route   POST /api/v1/homework
exports.createHomework = async (req, res, next) => {
  try {
    const { title, description, subject, classLevel, section, dueDate, status } = req.body;

    const homework = await Homework.create({
      institution: req.user.institution,
      title,
      description,
      subject,
      classLevel,
      section,
      dueDate,
      status: status || 'active',
      assignedBy: req.user._id,
    });

    const populatedHomework = await Homework.findById(homework._id)
      .populate('assignedBy', 'fullName');

    ApiResponse.created(res, { homework: populatedHomework }, 'হোমওয়ার্ক সফলভাবে দেওয়া হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    হোমওয়ার্ক বিস্তারিত
// @route   GET /api/v1/homework/:id
exports.getHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('assignedBy', 'firstName lastName fullName');

    if (!homework) {
      return ApiResponse.notFound(res, 'হোমওয়ার্ক পাওয়া যায়নি');
    }

    ApiResponse.success(res, { homework });
  } catch (error) {
    next(error);
  }
};

// @desc    হোমওয়ার্ক আপডেট
// @route   PATCH /api/v1/homework/:id
exports.updateHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!homework) {
      return ApiResponse.notFound(res, 'হোমওয়ার্ক পাওয়া যায়নি');
    }

    ApiResponse.success(res, { homework }, 'হোমওয়ার্ক আপডেট হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    হোমওয়ার্ক ডিলিট
// @route   DELETE /api/v1/homework/:id
exports.deleteHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return ApiResponse.notFound(res, 'হোমওয়ার্ক পাওয়া যায়নি');
    }

    // শুধু যে homework দিয়েছে সে delete করতে পারবে,
    // তবে super_admin ও admin সবসময় delete করতে পারবে
    const isOwner = homework.assignedBy.toString() === req.user._id.toString();
    const isAdmin = ['super_admin', 'admin'].includes(req.user.userType);

    if (!isOwner && !isAdmin) {
      return ApiResponse.forbidden(res, 'আপনি শুধুমাত্র নিজের দেওয়া হোমওয়ার্ক মুছতে পারবেন');
    }

    await homework.deleteOne();

    // হোমওয়ার্ক সাবমিশনগুলোও মুছে ফেলতে হবে
    await HomeworkSubmission.deleteMany({ homework: req.params.id });

    ApiResponse.success(res, null, 'হোমওয়ার্ক সফলভাবে মুছে ফেলা হয়েছে');
  } catch (error) {
    next(error);
  }
};
