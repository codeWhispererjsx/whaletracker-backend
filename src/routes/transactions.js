const express = require('express');
const router = express.Router();
const { getRecentTransactions } = require('../services/whaleService');

router.get('/api/whale-transactions', async (req, res) => {
  try {
    const txs = await getRecentTransactions(Number(req.query.limit) || 50);
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
