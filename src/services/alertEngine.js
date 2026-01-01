// Simple alert engine for server-side poller (ported from frontend)
function safeNumber(n) {
  const v = Number(n || 0);
  return Number.isNaN(v) ? 0 : v;
}

export function classifyTransaction(tx, trackedAddress) {
  if (!tx || !trackedAddress) return 'TRANSFER';
  const tracked = String(trackedAddress).toLowerCase();
  const from = String(tx.from || '').toLowerCase();
  const to = String(tx.to || '').toLowerCase();

  if (from === tracked && to !== tracked) return 'SELL';
  if (to === tracked && from !== tracked) return 'BUY';
  return 'TRANSFER';
}

export function generateAlerts(normalizedTxs = [], { trackedAddress, thresholdUSD = 0 } = {}) {
  if (!Array.isArray(normalizedTxs) || normalizedTxs.length === 0) return [];
  const threshold = safeNumber(thresholdUSD);
  const tracked = trackedAddress ? String(trackedAddress).toLowerCase() : null;

  const alerts = normalizedTxs
    .map((tx) => {
      const usd = safeNumber(tx.usdValue);
      return { tx, usd };
    })
    .filter(({ usd }) => usd >= threshold)
    .map(({ tx, usd }) => {
      const type = tracked ? classifyTransaction(tx, tracked) : 'TRANSFER';
      return {
        wallet: tracked || (tx.from || tx.to || 'unknown'),
        hash: tx.hash || null,
        type,
        amount: tx.amount || '0',
        asset: tx.amountAsset || tx.tokenSymbol || null,
        usdValue: Math.round(usd * 100) / 100,
        chain: tx.chain || null,
        timestamp: tx.timestamp || null,
        raw: tx.raw || null,
      };
    })
    .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));

  return alerts;
}

export default { classifyTransaction, generateAlerts };