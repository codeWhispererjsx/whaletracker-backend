// User-scoped alert storage abstraction. Replace with DB in production.
// Storage layout (in-memory): globalThis.__server_storage__.users = { [userId]: { wallets: [], alerts: [] } }

function getUserBucket(userId = 'anonymous') {
  if (!globalThis.__server_storage__) globalThis.__server_storage__ = {};
  if (!globalThis.__server_storage__.users) globalThis.__server_storage__.users = {};
  if (!globalThis.__server_storage__.users[userId]) globalThis.__server_storage__.users[userId] = { wallets: [], alerts: [] };
  return globalThis.__server_storage__.users[userId];
}

export function getAlerts(userId = 'anonymous') {
  const bucket = getUserBucket(userId);
  return bucket.alerts;
}

export function addAlert(userIdOrPayload, payloadIfAny) {
  // Support both signatures: addAlert(userId, alert) or addAlert(alert)
  let userId = 'anonymous';
  let payload = null;
  if (typeof userIdOrPayload === 'string') {
    userId = userIdOrPayload;
    payload = payloadIfAny;
  } else {
    payload = userIdOrPayload;
  }

  if (!payload || !payload.wallet) throw new Error('Alert must include wallet');
  const bucket = getUserBucket(userId);
  const a = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ...payload, status: payload.status || 'new', createdAt: new Date().toISOString() };
  bucket.alerts.unshift(a);
  return a;
}

export function findAlertByHash(userId = 'anonymous', hash) {
  if (!hash) return null;
  const bucket = getUserBucket(userId);
  return bucket.alerts.find((a) => a.hash && String(a.hash) === String(hash)) || null;
}

// Add an alert only if one with same wallet+hash doesn't already exist
export function addAlertIfNotExists(userId, payload) {
  const existing = findAlertByHash(userId, payload && payload.hash);
  if (existing) return { added: false, alert: existing };
  const a = addAlert(userId, payload);
  return { added: true, alert: a };
}

export function updateAlertStatus(userId, id, status) {
  const bucket = getUserBucket(userId);
  const list = bucket.alerts;
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  list[idx].status = status;
  return list[idx];
}

export default { getAlerts, addAlert, updateAlertStatus };