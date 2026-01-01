const express = require('express');
const router = express.Router();
const { upsertWhaleTransaction } = require('../services/whaleService');
const { getUsdToNgnRate } = require('../services/forexService');

router.post('/webhook/whale', async (req, res) => {
  try {
    const { tx_hash, wallet_address, direction, token_symbol, amount, usd_value, chain } = req.body;
    if (!tx_hash || !wallet_address || !direction || !token_symbol || !amount || !usd_value || !chain) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const usdToNgn = await getUsdToNgnRate();
    await upsertWhaleTransaction({
      tx_hash,
      wallet_address,
      direction,
      token_symbol,
      amount,
      usd_value,
      ngn_value: usd_value * usdToNgn,
      chain,
      timestamp: new Date()
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
