// server/src/config/plans.js

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    wallets: 3,
    features: {
      webhooks: false,
      priority_polling: false,
      advanced_filters: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    wallets: 25,
    features: {
      webhooks: true,
      priority_polling: true,
      advanced_filters: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    wallets: 1000,
    features: {
      webhooks: true,
      priority_polling: true,
      advanced_filters: true,
    },
  },
};

export function getPlan(id = 'free') {
  return PLANS[id] || PLANS.free;
}

export function getWalletLimit(planId = 'free') {
  return (getPlan(planId) || {}).wallets || 0;
}

export function isFeatureEnabled(planId = 'free', feature) {
  const p = getPlan(planId) || {};
  return Boolean(p.features && p.features[feature]);
}

export default { getPlan, getWalletLimit, isFeatureEnabled, PLANS };