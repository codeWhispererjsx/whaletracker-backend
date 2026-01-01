import alertsService from '../services/alertService.js';

export async function listAlerts(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || 'anonymous';
    const alerts = alertsService.getAlerts(userId);
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
}

export async function ingestAlert(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || 'anonymous';
    const payload = req.body;
    if (!payload || !payload.wallet) return res.status(400).json({ error: 'payload.wallet required' });
    const result = alertsService.addAlertIfNotExists(userId, payload);
    if (!result.added) return res.status(409).json({ error: 'duplicate alert', alert: result.alert });
    res.status(201).json({ alert: result.alert });
  } catch (err) {
    next(err);
  }
}

export async function markViewed(req, res, next) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const userId = req.headers['x-user-id'] || (req.user && req.user.id) || 'anonymous';
    const updated = alertsService.updateAlertStatus(userId, id, 'viewed');
    if (!updated) return res.status(404).json({ error: 'alert not found' });
    res.json({ alert: updated });
  } catch (err) {
    next(err);
  }
}