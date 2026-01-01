const fetch = require('node-fetch');
let cachedRate = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

async function getUsdToNgnRate() {
  const now = Date.now();
  if (cachedRate && now - lastFetch < CACHE_TTL) return cachedRate;

  const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
  const data = await res.json();
  if (!data || !data.rates || !data.rates.NGN) throw new Error('Failed to fetch FX rate');
  cachedRate = data.rates.NGN;
  lastFetch = now;
  return cachedRate;
}

module.exports = { getUsdToNgnRate };
