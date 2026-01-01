/*
 Server-side Moralis client wrapper.
 - Reads MORALIS_API_KEY from env
 - Exposes async functions to fetch native txs and ERC20 transfers
 - Uses node-fetch for REST calls (no SDK dependency required)
 - For production, keep API key secret and consider server-side caching/rate-limiting
*/
import fetch from 'node-fetch';
import logger from '../logger.js';

const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';
const API_KEY = process.env.MORALIS_API_KEY;

class MoralisError extends Error {
  constructor(message, status = null, body = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function mapChain(c) {
  if (!c) return null;
  const chain = String(c).toLowerCase();
  if (chain === 'ethereum' || chain === 'eth') return 'eth';
  if (chain === 'polygon' || chain === 'matic') return 'polygon';
  return chain;
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request(path, params = {}) {
  if (!API_KEY) throw new MoralisError('MORALIS_API_KEY not set in environment');
  const url = `${MORALIS_BASE}${path}${buildQuery(params)}`;
  const res = await fetch(url, { headers: { 'X-API-Key': API_KEY, Accept: 'application/json' } });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  if (!res.ok) {
    logger.error('[moralisService] request failed', { url, status: res.status, body: json });
    throw new MoralisError('Moralis API error', res.status, json);
  }
  return json;
}

export async function getNativeTransactions(address, { chain = 'ethereum', limit = 50 } = {}) {
  const chainParam = mapChain(chain);
  return request(`/${encodeURIComponent(address)}/transactions`, { chain: chainParam, limit });
}

export async function getERC20Transfers(address, { chain = 'ethereum', limit = 50 } = {}) {
  const chainParam = mapChain(chain);
  return request(`/${encodeURIComponent(address)}/erc20/transfers`, { chain: chainParam, limit });
}

export default { getNativeTransactions, getERC20Transfers };
