import express from 'express';
import * as controller from '../controllers/walletController.js';

const router = express.Router();

// Create a new tracked wallet
router.post('/', controller.createWallet);
// List wallets
router.get('/', controller.listWallets);
// Remove wallet
router.delete('/:address', controller.removeWallet);

export default router;