import express from 'express';
import { authenticate, requireBusiness } from '../middleware/auth';
import {
  getBusinessPayments,
  createPayment,
  updatePaymentStatus,
  getBusinessPaymentStats,
} from '../controllers/paymentController';

const router = express.Router();

// All payment routes require authentication
router.use(authenticate);

// Business payment routes
router.get('/business', requireBusiness, getBusinessPayments);
router.post('/business', requireBusiness, createPayment);
router.patch('/business/:id/status', requireBusiness, updatePaymentStatus);
router.get('/business/stats', requireBusiness, getBusinessPaymentStats);

export default router;
