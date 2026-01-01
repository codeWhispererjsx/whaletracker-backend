import walletService from '../services/walletService.js';
import { validateAddress } from '../../src/utils/addressValidators.js';

export async function createWallet(req, res, next) {
  try {
    const { address, network, threshold } = req.body;
    const v = validateAddress(address, network);
    if (!v.valid) return res.status(400).json({ error: v.error });

    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || 'anonymous';
    const userPlan = req.headers['x-user-plan'] || (req.user && req.user.plan) || 'free';

    const result = await walletService.addTrackedWallet(userId, { address, network, threshold }, { userPlan });
    if (!result.added) {
      if (result.reason === 'already_tracked') return res.status(409).json({ error: 'Already tracked' });
      if (result.reason === 'quota_exceeded') return res.status(403).json({ error: 'Quota exceeded', limit: result.limit });
      return res.status(400).json({ error: result.reason || 'failed' });
    }
    return res.status(201).json({ wallet: result.item });
  } catch (err) {
    next(err);
  }
}

export async function listWallets(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || 'anonymous';
    const wallets = walletService.getTrackedWallets(userId);
    res.json({ wallets });
  } catch (err) {
    next(err);
  }
}

export async function removeWallet(req, res, next) {
  try {
    const { address } = req.params;
    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || 'anonymous';
    const remaining = walletService.removeTrackedWallet(userId, address);
    res.json({ wallets: remaining });
  } catch (err) {
    next(err);
  }
}