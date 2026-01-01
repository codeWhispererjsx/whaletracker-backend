import poller from '../services/alertPoller.js';

export async function getStatus(req, res, next) {
  try {
    const status = poller.getStatus();
    res.json({ status });
  } catch (err) {
    next(err);
  }
}

export async function runNow(req, res, next) {
  try {
    const status = await poller.runNow();
    res.json({ status });
  } catch (err) {
    next(err);
  }
}