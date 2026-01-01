// Simple user-scoped wallet storage abstraction. Replace with DB implementation in production.
// Storage layout (in-memory): globalThis.__server_storage__.users = { [userId]: { wallets: [], alerts: [] } }

import { getWalletLimit } from '../config/plans.js';

function getUserBucket(userId = 'anonymous') {
  if (!globalThis.__server_storage__) globalThis.__server_storage__ = {};
  if (!globalThis.__server_storage__.users) globalThis.__server_storage__.users = {};
  if (!globalThis.__server_storage__.users[userId]) globalThis.__server_storage__.users[userId] = { wallets: [], alerts: [] };
  return globalThis.__server_storage__.users[userId];
}

export function getTrackedWallets(userId = 'anonymous') {
  const bucket = getUserBucket(userId);
  return bucket.wallets;
}

export function addTrackedWallet(userIdOrPayload, payloadIfAny, options = {}) {
  // Support both signatures for backward compatibility:
  // addTrackedWallet(userId, { address, network, threshold }, { userPlan }) or addTrackedWallet({ address, ... })
  let userId = 'anonymous';
  let payload = null;
  if (typeof userIdOrPayload === 'string') {
    userId = userIdOrPayload;
    payload = payloadIfAny;
  } else {
    payload = userIdOrPayload;
  }

  const { address, network = 'ethereum', threshold = 0 } = payload || {};
  if (!address) return { added: false, reason: 'missing_address' };

  const userPlan = (options && options.userPlan) || 'free';
  const limit = getWalletLimit(userPlan);

  const bucket = getUserBucket(userId);

  // Enforce per-plan wallet limit
  if (typeof limit === 'number' && limit >= 0 && bucket.wallets.length >= limit) {
    return { added: false, reason: 'quota_exceeded', limit };
  }

  const exists = bucket.wallets.some((w) => w.address.toLowerCase() === address.toLowerCase());
  if (exists) return { added: false, reason: 'already_tracked' };

  const item = { address, network, threshold, createdAt: new Date().toISOString() };
  bucket.wallets.unshift(item);
  return { added: true, item };
}

function awaitImportPlans() {
  // dynamic require to prevent top-level cycle issues
  try {
    // ESM import would be async; try synchronous require pattern supported by Node when transpiled
    // but in ESM runtime, import is async; we'll import via dynamic import and cache minimally
    return require('../config/plans.js');
  } catch (e) {
    // fallback to dynamic import for ESM
    return { getWalletLimit: (p) => (p === 'pro' ? 25 : 3) };
  }
}

export function removeTrackedWallet(userId, address) {
  const bucket = getUserBucket(userId);
  const filtered = bucket.wallets.filter((w) => w.address.toLowerCase() !== (address || '').toLowerCase());
  bucket.wallets = filtered;
  return filtered;
}

export default { getTrackedWallets, addTrackedWallet, removeTrackedWallet };