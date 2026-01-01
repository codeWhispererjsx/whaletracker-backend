import express from 'express';
import * as controller from '../controllers/pollerController.js';

const router = express.Router();

// Get poller status
router.get('/status', controller.getStatus);
// Trigger a run now
router.post('/run', controller.runNow);

export default router;
