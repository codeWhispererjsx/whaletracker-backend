import Stripe from 'stripe';
import userService from '../services/userService.js';
import { getPlan } from '../config/plans.js';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, { apiVersion: '2022-11-15' }) : null;

export async function createCheckout(req, res, next) {
  try {
    if (!stripe) return res.status(501).json({ error: 'Stripe not configured' });
    const { planId } = req.body;
    const userId = req.user && req.user.id ? req.user.id : 'anonymous';
    if (!planId) return res.status(400).json({ error: 'planId required' });
    const plan = getPlan(planId);
    if (!plan) return res.status(400).json({ error: 'invalid_plan' });

    // Create a Checkout Session with plan info in metadata
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${plan.name} Plan` },
            unit_amount: 5000, // demo: $50 flat pricing, replace with real price ids
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planId },
      success_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/settings?checkout=success`,
      cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/settings?checkout=cancel`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req, res, next) {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event = null;
    if (webhookSecret && stripe && typeof stripe.webhooks?.constructEvent === 'function') {
      const payload = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } else {
      // If no secret provided, try to read event directly (development)
      event = req.body;
    }

    if (event && (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded')) {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const userId = metadata.userId || (session.client_reference_id || null);
      const planId = metadata.planId || null;
      if (userId && planId) {
        userService.setUserPlan(userId, planId);
        console.log('[billing] Updated user plan via webhook', userId, planId);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling error', err);
    res.status(400).json({ error: 'webhook_error' });
  }
}
