// planGuard middleware - require a feature to be enabled for the user's plan
import { isFeatureEnabled } from '../config/plans.js';

export default function requireFeature(featureName) {
  return function (req, res, next) {
    const plan = req.user && req.user.plan ? req.user.plan : 'free';
    if (isFeatureEnabled(plan, featureName)) return next();
    return res.status(403).json({ error: 'feature_not_allowed', feature: featureName, plan });
  };
}