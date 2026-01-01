import express from 'express';
import * as controller from '../controllers/userController.js';

const router = express.Router();

// Get current user (based on requireAuth header X-User-Id)
router.get('/me', controller.getMe);

export default router;