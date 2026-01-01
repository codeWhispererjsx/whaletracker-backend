import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';


import walletsRouter from './routes/wallets.js';
import alertsRouter from './routes/alerts.js';
import pollerRouter from './routes/poller.js';
import billingRouter from './routes/billing.js';
import usersRouter from './routes/users.js';
import requireAuth from './middleware/requireAuth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import whaleWebhookRouter from './routes/webhook.js';
import whaleTransactionsRouter from './routes/transactions.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));


// Whale webhook (public, no auth)
app.use(whaleWebhookRouter);

// API
app.use(requireAuth);
app.use('/api/wallets', walletsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/poller', pollerRouter);
app.use('/api/billing', billingRouter);
app.use('/api/users', usersRouter);
app.use(whaleTransactionsRouter);

// 404
app.use(notFoundHandler);
// Error handler
app.use(errorHandler);

export default app;