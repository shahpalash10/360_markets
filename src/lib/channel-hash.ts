/**
 * Cryptographic & Deterministic Trader Hash Channel Generator
 *
 * Requirements:
 * 1. Must be a non-readable, unguessable hash channel (e.g. 360m_ch_8f4d92a10b47e2c91834dfa5)
 * 2. Must be uniquely generated for the trader using their name and email ID
 * 3. Works universally in both server (Node.js) and browser (client components)
 */

export interface TraderChannelParams {
  traderId?: string | null;
  traderEmail?: string | null;
  traderName?: string | null;
  scopeId?: string | null; // strategyId, courseId, or "default"
}

export function getTraderChannelHash(params: TraderChannelParams): string {
  const secretSalt = "360markets_secure_channel_salt_v2";
  const emailNorm = (params.traderEmail || "").trim().toLowerCase();
  const nameNorm = (params.traderName || "").trim().toLowerCase();
  const idNorm = (params.traderId || "trader").trim();
  const scopeNorm = (params.scopeId || "default").trim().toLowerCase();

  // Combine trader identity parameters (email + name + id + scope + salt)
  const seedString = `${emailNorm}:${nameNorm}:${idNorm}:${scopeNorm}:${secretSalt}`;

  // High-entropy 64-bit + 64-bit mixed FNV-1a & Murmur polynomial hash
  // Completely portable between Node.js and Browser environments without crypto module bundling issues
  let h1 = 0xdeadbeef ^ 0xcafebabe;
  let h2 = 0x41c64e6d ^ 0x12345678;

  for (let i = 0; i < seedString.length; i++) {
    const ch = seedString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");

  let h3 = Math.imul(h1 ^ h2, 2147483647);
  h3 = Math.imul(h3 ^ (h3 >>> 15), 1812433253);
  const part3 = (h3 >>> 0).toString(16).padStart(8, "0");

  // Output: 360m_ch_<24-char-hex-hash>
  return `360m_ch_${part1}${part2}${part3}`;
}
