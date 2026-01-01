// Placeholder auth middleware. Replace with real implementation (JWT, OAuth, etc.)
// For now, allow a simple "X-User-Id" and optional "X-User-Plan" header to simulate authenticated requests in development.
import userService from '../services/userService.js';

export default function requireAuth(req, res, next) {
  const header = req.headers['x-user-id'];
  const planHeader = req.headers['x-user-plan'];
  if (header) {
    // ensure user exists in persisted store
    const u = userService.ensureUser(String(header), { plan: planHeader || 'free' });
    req.user = { id: String(header), plan: u.plan || (planHeader ? String(planHeader) : 'free') };
  } else {
    // attach an anonymous user object (helps downstream code avoid checks)
    req.user = { id: 'anonymous', plan: planHeader ? String(planHeader) : 'free' };
  }
  next();
}