import express from 'express';
import * as controller from '../controllers/billingController.js';

const router = express.Router();

// Create a Stripe Checkout session for plan upgrade
router.post('/checkout', controller.createCheckout);
// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), controller.stripeWebhook);

export default router;