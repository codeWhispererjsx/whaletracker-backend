import logger from '../logger.js';
import moralisService from './moralisService.js';
import alertsService from './alertService.js';
import walletService from './walletService.js';
import { normalizeMoralisTxs } from '../utils/moralisNormalizer.js';
import alertEngine from './alertEngine.js';

const DEFAULT_INTERVAL = Number(process.env.POLL_INTERVAL_SECONDS) || 60; // seconds
const CONCURRENCY = Number(process.env.POLL_CONCURRENCY) || 5; // concurrent requests
const LIMIT = Number(process.env.MORALIS_FETCH_LIMIT) || 25; // per-request limit
const MAX_SEEN = Number(process.env.POLLER_MAX_SEEN) || 500; // per-user seen txs to retain

let intervalHandle = null;
let state = {
  running: false,
  lastRunAt: null,
  lastRunDurationMs: 0,
  lastAdded: 0,
  lastError: null,
};

function getAllUsers() {
  if (!globalThis.__server_storage__ || !globalThis.__server_storage__.users) return [];
  return Object.keys(globalThis.__server_storage__.users || {});
}

function ensurePollerBucket(userId) {
  if (!globalThis.__server_storage__) globalThis.__server_storage__ = {};
  if (!globalThis.__server_storage__.users) globalThis.__server_storage__.users = {};
  if (!globalThis.__server_storage__.users[userId]) globalThis.__server_storage__.users[userId] = { wallets: [], alerts: [] };
  const bucket = globalThis.__server_storage__.users[userId];
  if (!bucket.poller) bucket.poller = { seenHashes: [] };
  return bucket.poller;
}

function addSeenHashForUser(userId, hash) {
  const p = ensurePollerBucket(userId);
  p.seenHashes.unshift(hash);
  // keep size bounded
  if (p.seenHashes.length > MAX_SEEN) p.seenHashes.length = MAX_SEEN;
}

function hasSeenHash(userId, hash) {
  if (!hash) return false;
  const p = ensurePollerBucket(userId);
  return p.seenHashes.includes(String(hash));
}

async function fetchTxsForAddress(address, chain) {
  try {
    const [native, erc20] = await Promise.all([
      moralisService.getNativeTransactions(address, { chain, limit: LIMIT }).catch((e) => {
        logger.warn('[poller] native fetch failed', { address, chain, err: String(e) });
        return [];
      }),
      moralisService.getERC20Transfers(address, { chain, limit: LIMIT }).catch((e) => {
        logger.warn('[poller] erc20 fetch failed', { address, chain, err: String(e) });
        return [];
      }),
    ]);
    // Both endpoints return arrays in the Moralis shape; concatenate
    const combined = Array.isArray(native) ? native : [];
    if (Array.isArray(erc20)) combined.push(...erc20);
    return combined;
  } catch (err) {
    logger.error('[poller] fetchTxsForAddress error', { err: String(err) });
    return [];
  }
}

// Simple concurrency mapper
async function mapWithConcurrency(items, mapper, concurrency = 5) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => mapper(item));
    results.push(p);
    executing.push(p);
    if (executing.length >= concurrency) {
      await Promise.race(executing).catch(() => {});
      // remove resolved
      for (let i = executing.length - 1; i >= 0; i--) {
        if (executing[i].isFulfilled || executing[i].isResolved) {
          executing.splice(i, 1);
        }
      }
      // best-effort cleanup (we don't have isFulfilled on native Promise, but race will proceed)
    }
  }
  return Promise.all(results);
}

// Run one poll cycle
export async function runOnce() {
  const start = Date.now();
  state.running = true;
  state.lastError = null;
  let addedCount = 0;

  try {
    const users = getAllUsers();
    // iterate users sequentially to keep per-user rate prudent
    for (const userId of users) {
      try {
        const wallets = walletService.getTrackedWallets(userId) || [];
        // fetch per wallet with limited concurrency
        const tasks = wallets.map(async (w) => {
          const address = w.address;
          const network = w.network || 'ethereum';
          const threshold = w.threshold || 0;
          const rawTxs = await fetchTxsForAddress(address, network);
          if (!Array.isArray(rawTxs) || rawTxs.length === 0) return 0;
          const normalized = normalizeMoralisTxs(rawTxs, { chain: network });
          // filter out seen and create new list
          const newTxs = normalized.filter((t) => t && t.hash && !hasSeenHash(userId, t.hash));
          if (newTxs.length === 0) return 0;
          // mark seen
          newTxs.forEach((t) => addSeenHashForUser(userId, t.hash));
          const generated = alertEngine.generateAlerts(newTxs, { trackedAddress: address, thresholdUSD: threshold });
          // add alerts (avoid duplicates)
          let added = 0;
          for (const a of generated) {
            const result = alertsService.addAlertIfNotExists(userId, a);
            if (result.added) added++;
          }
          return added;
        });

        // run tasks with concurrency limit
        const chunkSize = CONCURRENCY;
        for (let i = 0; i < tasks.length; i += chunkSize) {
          const chunk = tasks.slice(i, i + chunkSize).map((t) => t());
          const res = await Promise.all(chunk);
          addedCount += res.reduce((s, v) => s + (v || 0), 0);
        }
      } catch (err) {
        logger.error('[poller] user loop error', { userId, err: String(err) });
      }
    }

    state.lastRunAt = new Date().toISOString();
    state.lastRunDurationMs = Date.now() - start;
    state.lastAdded = addedCount;
    state.lastError = null;
    logger.info('[poller] run complete', { users: users.length, added: addedCount, durationMs: state.lastRunDurationMs });
  } catch (err) {
    logger.error('[poller] run error', { err: String(err) });
    state.lastError = String(err);
  } finally {
    state.running = false;
  }
}

export function start() {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    runOnce().catch((e) => logger.error('[poller] interval run error', { e: String(e) }));
  }, DEFAULT_INTERVAL * 1000);
  // also run immediately
  runOnce().catch((e) => logger.error('[poller] initial run failed', { e: String(e) }));
}

export function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export function getStatus() {
  return { ...state, intervalSeconds: DEFAULT_INTERVAL };
}

export async function runNow() {
  await runOnce();
  return getStatus();
}

export default { start, stop, getStatus, runNow };
