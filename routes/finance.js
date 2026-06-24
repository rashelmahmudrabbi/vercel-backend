const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/invoices', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant', 'student', 'guardian'), financeController.getInvoices);
router.post('/invoices', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'), financeController.createInvoice);
router.post('/invoices/generate-monthly', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'), financeController.generateMonthlyInvoices);
router.post('/invoices/generate-category', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'), financeController.generateCategoryInvoices);
router.post('/payments', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant', 'student', 'guardian'), financeController.receivePayment);

// Payment Verification Routes
router.get('/payments/pending', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'), financeController.getPendingPayments);
router.post('/payments/:id/verify', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'), financeController.verifyPayment);
router.post('/payments/:id/reject', authorize('super_admin', 'co_super_admin', 'admin', 'principal', 'accountant'), financeController.rejectPayment);

module.exports = router;
