// Utility functions for detecting chain and validating wallet addresses

/** Basic Ethereum address (0x + 40 hex chars) */
export function isEthAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/** ENS name (very simple check) */
export function isEnsName(addr) {
  return typeof addr === 'string' && addr.toLowerCase().endsWith('.eth');
}

/** Solana public keys are base58, typically 43 or 44 chars */
export function isSolanaAddress(addr) {
  return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(addr);
}

/**
 * Basic Bitcoin address checks for legacy and bech32 formats.
 * This is a lightweight check (regex-based); for production-grade validation
 * consider using a bitcoin library to validate checksums.
 */
export function isBtcAddress(addr) {
  if (!addr || typeof addr !== 'string') return false;
  const legacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/; // P2PKH and P2SH
  const bech32 = /^(bc1)[0-9a-z]{25,39}$/i; // bech32
  return legacy.test(addr) || bech32.test(addr);
}

/**
 * Heuristic to detect chain type from an address string.
 * Returns: 'ethereum' | 'solana' | 'bitcoin' | 'unknown'
 */
export function detectChain(addr) {
  if (!addr || typeof addr !== 'string') return 'unknown';
  const trimmed = addr.trim();
  if (trimmed.startsWith('0x') && isEthAddress(trimmed)) return 'ethereum';
  if (isEnsName(trimmed)) return 'ethereum';
  if (isSolanaAddress(trimmed)) return 'solana';
  if (isBtcAddress(trimmed)) return 'bitcoin';
  return 'unknown';
}

/**
 * Validate wallet address for a given chain/network.
 * Returns { valid: boolean, error?: string }
 */
export function validateAddress(addr, network) {
  if (!addr || typeof addr !== 'string') {
    return { valid: false, error: 'Address required' };
  }
  switch (network) {
    case 'ethereum':
      if (isEthAddress(addr) || isEnsName(addr)) return { valid: true };
      return { valid: false, error: 'Invalid Ethereum address or ENS name' };
    case 'solana':
      if (isSolanaAddress(addr)) return { valid: true };
      return { valid: false, error: 'Invalid Solana address' };
    case 'bitcoin':
      if (isBtcAddress(addr)) return { valid: true };
      return { valid: false, error: 'Invalid Bitcoin address' };
    default:
      return { valid: false, error: 'Unsupported network' };
  }
}
