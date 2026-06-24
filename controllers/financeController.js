const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const ApiResponse = require('../utils/apiResponse');

// @desc    সকল ইনভয়েস তালিকা
// @route   GET /api/v1/finance/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const filter = { institution: req.user.institution };

    // If student or guardian, filter invoices for that student
    if (req.user.userType === 'student') {
      filter.student = req.user.profileId;
    } else if (req.user.userType === 'guardian') {
      // Find students linked to this guardian
      const Guardian = require('../models/Guardian');
      const guardianDoc = await Guardian.findById(req.user.profileId);
      const studentIds = guardianDoc ? guardianDoc.students.map(s => s.student) : [];
      filter.student = { $in: studentIds };
    } else if (req.query.student) {
      filter.student = req.query.student;
    }

    if (req.query.status) filter.status = req.query.status;

    const invoices = await Invoice.find(filter)
      .populate({
        path: 'student',
        select: 'studentId currentEnrollment user',
        populate: [
          {
            path: 'user',
            select: 'firstName lastName fullName'
          },
          {
            path: 'currentEnrollment',
            populate: [
              { path: 'classLevel', select: 'name monthlyFee admissionFee sessionFee examFee' },
              { path: 'section', select: 'name' }
            ]
          }
        ]
      })
      .sort({ issueDate: -1 });

    // For each invoice, fetch associated payments, populate receivedBy, and retrieve guardian details
    const invoicesWithPayments = await Promise.all(
      invoices.map(async (inv) => {
        const payments = await Payment.find({ invoice: inv._id })
          .populate('receivedBy', 'firstName lastName userType adminRole')
          .sort({ createdAt: 1 });

        const Guardian = require('../models/Guardian');
        const guardianDoc = await Guardian.findOne({ 'students.student': inv.student?._id })
          .populate('user', 'firstName lastName phone');

        return {
          ...inv.toObject(),
          payments,
          guardian: guardianDoc ? {
            name: guardianDoc.user ? `${guardianDoc.user.firstName || ''} ${guardianDoc.user.lastName || ''}`.trim() : '—',
            phone: guardianDoc.user?.phone || '—',
            relationship: guardianDoc.relationshipLabel || '—'
          } : null
        };
      })
    );

    ApiResponse.success(res, { invoices: invoicesWithPayments });
  } catch (error) {
    next(error);
  }
};

// @desc    নতুন ইনভয়েস তৈরি
// @route   POST /api/v1/finance/invoices
exports.createInvoice = async (req, res, next) => {
  try {
    const { student, title, dueDate, subtotal, discountTotal, fineTotal } = req.body;

    const payableTotal = (subtotal + (fineTotal || 0)) - (discountTotal || 0);
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await Invoice.create({
      institution: req.user.institution,
      student,
      invoiceNumber,
      title,
      dueDate,
      subtotal,
      discountTotal,
      fineTotal,
      payableTotal,
      balance: payableTotal,
    });

    ApiResponse.created(res, { invoice }, 'ইনভয়েস সফলভাবে তৈরি করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    পেমেন্ট গ্রহণ / পেমেন্ট রিকোয়েস্ট সাবমিট
// @route   POST /api/v1/finance/payments
exports.receivePayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, method, transactionReference, feeMonth } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return ApiResponse.notFound(res, 'ইনভয়েস পাওয়া যায়নি');
    if (invoice.status === 'paid') return ApiResponse.error(res, 'এই ইনভয়েসটি ইতিমধ্যে পরিশোধিত', 400);

    const isMobileBanking = ['bkash', 'rocket', 'nagad'].includes(method);
    if (isMobileBanking && !transactionReference) {
      return ApiResponse.error(res, 'মোবাইল ব্যাংকিং পেমেন্টের জন্য ট্রানজেকশন আইডি আবশ্যক', 400);
    }

    // Auto calculate 2% gateway charge (20 Tk per 1000 Tk) for mobile banking
    const gatewayCharge = isMobileBanking ? amount * 0.02 : 0;

    // Calculate advance paid & balance after payment
    const advancePaid = Math.max(0, amount - invoice.balance);
    const balanceAfterPayment = Math.max(0, invoice.balance - amount);

    // If method is mobile banking, status is 'pending' (needs admin approval)
    // If method is cash/bank/online, status is 'success' immediately
    const isStaff = ['super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'].includes(req.user.userType) ||
      ['co_super_admin', 'admin'].includes(req.user.adminRole);

    const status = isMobileBanking ? 'pending' : 'success';

    const payment = await Payment.create({
      institution: req.user.institution,
      student: invoice.student,
      invoice: invoice._id,
      paymentNumber: `PAY-${Date.now()}`,
      amount,
      method,
      transactionReference,
      feeMonth,
      gatewayCharge,
      advancePaid,
      balanceAfterPayment,
      receivedBy: status === 'success' && isStaff ? req.user._id : undefined,
      status,
    });

    // Update invoice ONLY if status is 'success' immediately
    if (status === 'success') {
      invoice.paidTotal += amount;
      invoice.balance = balanceAfterPayment;
      if (invoice.balance <= 0) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partial';
      }
      await invoice.save();
    }

    const message = status === 'pending'
      ? 'পেমেন্ট রিকোয়েস্টটি সফলভাবে জমা দেওয়া হয়েছে এবং যাচাইকরণের জন্য অপেক্ষাধীন রয়েছে।'
      : 'পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে।';

    ApiResponse.success(res, { payment, invoice }, message);
  } catch (error) {
    next(error);
  }
};

// @desc    অপেক্ষাধীন (Pending) পেমেন্ট রিকোয়েস্ট তালিকা
// @route   GET /api/v1/finance/payments/pending
exports.getPendingPayments = async (req, res, next) => {
  try {
    const filter = {
      institution: req.user.institution,
      status: 'pending'
    };

    const payments = await Payment.find(filter)
      .populate({
        path: 'student',
        select: 'studentId currentEnrollment user',
        populate: [
          {
            path: 'user',
            select: 'firstName lastName fullName'
          },
          {
            path: 'currentEnrollment',
            populate: [
              { path: 'classLevel', select: 'name monthlyFee admissionFee sessionFee examFee' },
              { path: 'section', select: 'name' }
            ]
          }
        ]
      })
      .populate('invoice', 'invoiceNumber title balance')
      .sort({ createdAt: -1 });

    const paymentsWithGuardians = await Promise.all(
      payments.map(async (p) => {
        const Guardian = require('../models/Guardian');
        const guardianDoc = await Guardian.findOne({ 'students.student': p.student?._id })
          .populate('user', 'firstName lastName phone');
        return {
          ...p.toObject(),
          guardian: guardianDoc ? {
            name: guardianDoc.user ? `${guardianDoc.user.firstName || ''} ${guardianDoc.user.lastName || ''}`.trim() : '—',
            phone: guardianDoc.user?.phone || '—',
            relationship: guardianDoc.relationshipLabel || '—'
          } : null
        };
      })
    );

    ApiResponse.success(res, { payments: paymentsWithGuardians });
  } catch (error) {
    next(error);
  }
};

// @desc    পেমেন্ট রিকোয়েস্ট ভেরিফাই/অনুমোদন করুন
// @route   POST /api/v1/finance/payments/:id/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return ApiResponse.notFound(res, 'পেমেন্ট রেকর্ড পাওয়া যায়নি');
    if (payment.status !== 'pending') return ApiResponse.error(res, 'এই পেমেন্টটি ইতিমধ্যে ভেরিফাই বা বাতিল করা হয়েছে', 400);

    const invoice = await Invoice.findById(payment.invoice);
    if (!invoice) return ApiResponse.notFound(res, 'সংশ্লিষ্ট ইনভয়েস পাওয়া যায়নি');

    // Update payment
    payment.status = 'success';
    payment.receivedBy = req.user._id;
    await payment.save();

    // Update invoice balance
    invoice.paidTotal += payment.amount;
    invoice.balance = Math.max(0, invoice.balance - payment.amount);
    if (invoice.balance <= 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partial';
    }
    await invoice.save();

    ApiResponse.success(res, { payment, invoice }, 'পেমেন্ট সফলভাবে ভেরিফাই এবং অনুমোদন করা হয়েছে।');
  } catch (error) {
    next(error);
  }
};

// @desc    পেমেন্ট রিকোয়েস্ট প্রত্যাখ্যান (Reject) করুন
// @route   POST /api/v1/finance/payments/:id/reject
exports.rejectPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return ApiResponse.notFound(res, 'পেমেন্ট রেকর্ড পাওয়া যায়নি');
    if (payment.status !== 'pending') return ApiResponse.error(res, 'এই পেমেন্টটি অপেক্ষাধীন নয়', 400);

    payment.status = 'failed';
    payment.receivedBy = req.user._id;
    await payment.save();

    ApiResponse.success(res, { payment }, 'পেমেন্ট রিকোয়েস্ট প্রত্যাখ্যান করা হয়েছে।');
  } catch (error) {
    next(error);
  }
};

// @desc    চলতি মাসের ইনভয়েস ম্যানুয়ালি তৈরি করুন (Batch generate tuition fees)
// @route   POST /api/v1/finance/invoices/generate-monthly
exports.generateMonthlyInvoices = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return ApiResponse.error(res, 'মাস এবং বছর নির্বাচন আবশ্যক', 400);
    }
    const { generateMonthlyInvoicesForCurrentMonth } = require('../utils/invoiceScheduler');
    const count = await generateMonthlyInvoicesForCurrentMonth(month, year, req.user.institution);
    ApiResponse.success(res, { count }, `${count} টি নতুন মাসিক বেতনের ইনভয়েস তৈরি করা হয়েছে।`);
  } catch (error) {
    next(error);
  }
};

// @desc    নির্দিষ্ট ফি ক্যাটাগরির ইনভয়েস ব্যাচ তৈরি করুন (Admission, Session, or Exam fee)
// @route   POST /api/v1/finance/invoices/generate-category
exports.generateCategoryInvoices = async (req, res, next) => {
  try {
    const { category, month, year } = req.body;
    if (!category || !month || !year) {
      return ApiResponse.error(res, 'ফি ক্যাটাগরি, মাস এবং বছর নির্বাচন আবশ্যক', 400);
    }
    const { generateCategoryInvoicesForCurrentMonth } = require('../utils/invoiceScheduler');
    const count = await generateCategoryInvoicesForCurrentMonth(category, month, year, req.user.institution);
    ApiResponse.success(res, { count }, `${count} টি নতুন ইনভয়েস তৈরি করা হয়েছে।`);
  } catch (error) {
    next(error);
  }
};

