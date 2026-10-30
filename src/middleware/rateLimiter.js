export function createRateLimiter(config) {
  const windows = new Map();
  const cooldowns = new Map();

  function prune(map, now, ttl) {
    for (const [key, value] of map.entries()) {
      const stamp = typeof value === 'number' ? value : value.expires;
      if (stamp + ttl < now) {
        map.delete(key);
      }
    }
  }

  function checkRateLimit(senderJid, now = Date.now()) {
    prune(windows, now, config.rateLimitWindowMs * 4);
    const current = windows.get(senderJid);

    if (!current || current.expires <= now) {
      windows.set(senderJid, { count: 1, expires: now + config.rateLimitWindowMs });
      return { allowed: true, remaining: config.rateLimitMax - 1 };
    }

    if (current.count >= config.rateLimitMax) {
      return { allowed: false, remaining: 0, retryAfterMs: current.expires - now };
    }

    current.count += 1;
    return { allowed: true, remaining: config.rateLimitMax - current.count };
  }

  function checkCooldown(senderJid, commandName, now = Date.now()) {
    const key = `${senderJid}:${commandName}`;
    prune(cooldowns, now, config.commandCooldownMs * 4);
    const last = cooldowns.get(key) || 0;
    const elapsed = now - last;

    if (elapsed < config.commandCooldownMs) {
      return { allowed: false, retryAfterMs: config.commandCooldownMs - elapsed };
    }

    cooldowns.set(key, now);
    return { allowed: true, retryAfterMs: 0 };
  }

  function reset() {
    windows.clear();
    cooldowns.clear();
  }

  return { checkRateLimit, checkCooldown, reset };
}

export default createRateLimiter;
