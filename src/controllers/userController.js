import userService from '../services/userService.js';

export async function getMe(req, res, next) {
  try {
    const userId = req.user && req.user.id ? req.user.id : 'anonymous';
    const u = userService.getUser(userId) || userService.ensureUser(userId);
    res.json({ user: u });
  } catch (err) {
    next(err);
  }
}

export default { getMe };