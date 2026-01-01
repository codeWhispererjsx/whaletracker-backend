import express from 'express';
import * as controller from '../controllers/alertController.js';

const router = express.Router();

// List alerts
router.get('/', controller.listAlerts);
// Ingest a new alert (server-side worker or poller can POST here)
router.post('/', controller.ingestAlert);
// Mark alert viewed
router.post('/mark-viewed', controller.markViewed);

export default router;