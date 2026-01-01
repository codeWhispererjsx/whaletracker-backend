import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './logger.js';
import poller from './services/alertPoller.js';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

// start the poller
poller.start();
logger.info('[server] alert poller started');

function shutdown() {
  logger.info('Shutting down...');
  poller.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
