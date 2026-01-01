/*
  server/src/utils/moralisNormalizer.js
  (Copied & adapted from frontend normalizer)
*/
function safeGet(obj, ...keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return undefined;
}

function toIso(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseUsd(tx) {
  const candidates = [
    safeGet(tx, 'value_quote'),
    safeGet(tx, 'value_quote_usd'),
    safeGet(tx, 'value_usd'),
    safeGet(tx, 'usd_value'),
    safeGet(tx, 'valueUsd'),
    safeGet(tx, 'quote'),
    safeGet(tx, 'quote_rate'),
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const n = Number(c);
    if (!Number.isNaN(n)) return Math.round(n * 100) / 100;
  }
  return 0;
}

function formatAmount(valueStr = '0', decimals = 18, precision = 6) {
  try {
    const v = BigInt(valueStr || '0');
    const dec = BigInt(decimals);
    const base = 10n ** dec;
    const intPart = v / base;
    const frac = v % base;

    if (frac === 0n) return intPart.toString();

    const prec = BigInt(precision);
    const scaled = (frac * (10n ** prec)) / base;
    let fracStr = scaled.toString().padStart(Number(prec), '0');
    fracStr = fracStr.replace(/0+$/, '');
    return `${intPart.toString()}.${fracStr}`;
  } catch (e) {
    try {
      const n = Number(valueStr) / Math.pow(10, decimals);
      return String(Math.round(n * 10 ** precision) / 10 ** precision);
    } catch (e2) {
      return '0';
    }
  }
}

export function normalizeMoralisTx(rawTx = {}, { chain: chainHint } = {}) {
  const hash = safeGet(rawTx, 'hash', 'transaction_hash', 'tx_hash', 'txHash');
  const from = safeGet(rawTx, 'from_address', 'from', 'sender_address', 'transaction_from') || null;
  const to = safeGet(rawTx, 'to_address', 'to', 'recipient_address', 'transaction_to') || null;
  const timestamp = toIso(safeGet(rawTx, 'block_timestamp', 'block_time', 'received_at', 'date', 'timestamp'));
  const chain = chainHint || safeGet(rawTx, 'chain', 'network', 'blockchain') || null;
  const tokenSymbol = safeGet(rawTx, 'token_symbol', 'asset', 'asset_symbol') || safeGet(rawTx, 'symbol');
  const tokenDecimals = Number(safeGet(rawTx, 'token_decimals', 'decimals', 'decimals_token')) || undefined;

  let amount = '0';
  let amountAsset = tokenSymbol || (chain && chain.toLowerCase().includes('sol') ? 'SOL' : 'ETH');
  const nativeValue = safeGet(rawTx, 'value', 'native_value');
  const tokenValue = safeGet(rawTx, 'value', 'token_value', 'amount');

  if (tokenSymbol && tokenValue != null) {
    const dec = tokenDecimals === undefined || Number.isNaN(tokenDecimals) ? 18 : tokenDecimals;
    amount = formatAmount(String(tokenValue), dec, 6);
    amountAsset = tokenSymbol;
  } else if (tokenSymbol && nativeValue == null && safeGet(rawTx, 'value') != null && tokenDecimals != null) {
    const dec = tokenDecimals;
    amount = formatAmount(String(safeGet(rawTx, 'value')), dec, 6);
    amountAsset = tokenSymbol;
  } else if (nativeValue != null && (tokenSymbol == null)) {
    const dec = 18;
    amount = formatAmount(String(nativeValue), dec, 6);
    amountAsset = chain && chain.toLowerCase().includes('sol') ? 'SOL' : 'ETH';
  } else if (tokenValue != null) {
    const dec = tokenDecimals || 18;
    amount = formatAmount(String(tokenValue), dec, 6);
  } else {
    const alt = safeGet(rawTx, 'transfer_value', 'amount_value');
    if (alt != null) amount = formatAmount(String(alt), tokenDecimals || 18, 6);
  }

  const usdValue = parseUsd(rawTx);

  return {
    hash: hash || null,
    from,
    to,
    amount,
    amountAsset,
    usdValue,
    chain,
    timestamp,
    tokenSymbol: tokenSymbol || null,
    tokenDecimals: tokenDecimals || null,
    raw: rawTx,
  };
}

export function normalizeMoralisTxs(rawArray = [], opts = {}) {
  if (!Array.isArray(rawArray)) return [];
  return rawArray.map((t) => normalizeMoralisTx(t, opts));
}

export default { normalizeMoralisTx, normalizeMoralisTxs };