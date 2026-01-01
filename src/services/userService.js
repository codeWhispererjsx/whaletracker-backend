// server/src/services/userService.js
// Simple file-backed user service for dev. Replace with real DB in production.
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'server', 'data');
const FILE = path.join(DB_PATH, 'users.json');

function ensureDir() {
  try {
    if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}), 'utf8');
  } catch (e) {
    // noop
  }
}

function readAll() {
  try {
    ensureDir();
    const raw = fs.readFileSync(FILE, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeAll(obj) {
  try {
    ensureDir();
    fs.writeFileSync(FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    // noop
  }
}

export function getUser(id) {
  const all = readAll();
  return all[id] || null;
}

export function ensureUser(id, defaults = {}) {
  const all = readAll();
  if (!all[id]) {
    all[id] = { id, email: defaults.email || null, plan: defaults.plan || 'free', createdAt: new Date().toISOString() };
    writeAll(all);
  }
  return all[id];
}

export function setUserPlan(id, planId) {
  const all = readAll();
  if (!all[id]) all[id] = { id, email: null, plan: planId, createdAt: new Date().toISOString() };
  all[id].plan = planId;
  all[id].updatedAt = new Date().toISOString();
  writeAll(all);
  return all[id];
}

export default { getUser, ensureUser, setUserPlan };