import Redis from 'ioredis';
import { log } from './vite';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Redis without breaking the app if it fails
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) {
      log('Redis connection failed too many times, disabling cache.');
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 50, 2000);
  },
  lazyConnect: true,
});

let isRedisConnected = false;

redis.on('connect', () => {
  isRedisConnected = true;
  log('✅ Redis connected successfully.');
});

redis.on('error', (err) => {
  isRedisConnected = false;
  // Non logghiamo in modo rumoroso in sviluppo se Redis è intenzionalmente spento
  if (process.env.NODE_ENV !== 'development') {
    console.error('Redis error:', err.message);
  }
});

// Avviamo la connessione in background
redis.connect().catch(() => {
  log('⚠️ Redis not available. Fallback to direct DB queries.');
});

/**
 * Wrapper for safely getting and setting cached data.
 * If Redis is down, it executes the fallback function directly.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchData: () => Promise<T>
): Promise<T> {
  if (!isRedisConnected) {
    return fetchData();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetchData();
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    return data;
  } catch (error) {
    // Fallback on error
    console.warn(`Redis cache error for key ${key}, falling back to DB:`, error);
    return fetchData();
  }
}

/**
 * Helper to invalidate a cache key (e.g., after an UPDATE)
 */
export async function invalidateCache(keyPrefix: string) {
  if (!isRedisConnected) return;
  try {
    const keys = await redis.keys(`${keyPrefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`Failed to invalidate cache for ${keyPrefix}:`, error);
  }
}
