
import express from 'express';
import { getRecentTransactions } from '../services/whaleService.js';

const router = express.Router();

router.get('/api/whale-transactions', async (req, res) => {
  try {
    const txs = await getRecentTransactions(Number(req.query.limit) || 50);
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
