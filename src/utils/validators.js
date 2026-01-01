// Lightweight validators for server API (re-uses frontend validators where possible)
export function isEthAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function isSolanaAddress(addr) {
  return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(addr);
}

export function isBtcAddress(addr) {
  if (!addr || typeof addr !== 'string') return false;
  const legacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32 = /^(bc1)[0-9a-z]{25,39}$/i;
  return legacy.test(addr) || bech32.test(addr);
}

export function validateAddressForNetwork(addr, network) {
  if (!addr) return { valid: false, error: 'address required' };
  const trimmed = addr.trim();
  switch ((network || '').toLowerCase()) {
    case 'ethereum':
    case 'eth':
    case 'polygon':
    case 'matic':
    case 'bsc':
      return { valid: isEthAddress(trimmed) };
    case 'solana':
    case 'sol':
      return { valid: isSolanaAddress(trimmed) };
    case 'bitcoin':
    case 'btc':
      return { valid: isBtcAddress(trimmed) };
    default:
      return { valid: false, error: 'unsupported network' };
  }
}