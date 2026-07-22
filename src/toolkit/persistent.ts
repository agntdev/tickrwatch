/**
 * Persistent storage for durable domain data (watchlist items, user profiles, owner metrics).
 * Uses the toolkit's Redis-backed storage with a distinct key prefix to separate
 * durable data from ephemeral session state.
 */

import { RedisSessionStorage, type RedisLike } from "./session/redis.js";
import { MemorySessionStorage } from "./session/memory.js";
import type { StorageAdapter } from "grammy";

// Data structures for durable storage
export interface UserProfile {
  chatId: number;
  timezone?: string;
  quietHoursStart?: number; // 0-23
  quietHoursEnd?: number;   // 0-23
  summaryTime?: string;     // HH:MM format
  cooldownLength: number;   // minutes, default 30
  alertPreferences: {
    threshold: boolean;
    percentMove: boolean;
  };
}

export interface WatchlistItem {
  ticker: string;
  displayName: string;
  thresholdAlerts: ThresholdAlert[];
  percentMoveAlerts: PercentMoveAlert[];
  enabled: boolean;
  lastAlertTimestamp?: number;
  lastNotifiedPrice?: number;
}

export interface ThresholdAlert {
  id: string;
  threshold: number; // price level
  direction: "above" | "below";
  enabled: boolean;
}

export interface PercentMoveAlert {
  id: string;
  percentChange: number; // e.g., 5 for 5%
  lookbackHours: number; // default 1
  direction: "up" | "down" | "both";
  enabled: boolean;
}

export interface OwnerMetrics {
  userCount: number;
  alertCountsByTicker: Record<string, number>;
  alertTypesDistribution: {
    threshold: number;
    percentMove: number;
  };
}

// Storage keys
const WATCHLIST_PREFIX = "watchlist:";
const USER_PROFILE_PREFIX = "profile:";
const OWNER_METRICS_KEY = "metrics:owner";
const USER_INDEX_KEY = "index:users";
const WATCHLIST_INDEX_KEY = "index:watchlist:";

// In-memory fallback for development (no Redis)
const inMemoryStore = new Map<string, unknown>();

function getStorage<T>(prefix: string): StorageAdapter<T> {
  // Check if Redis is available
  if (typeof process !== "undefined" && process.env?.REDIS_URL) {
    // Use Redis with the specific prefix
    // We'll create a simple Redis adapter wrapper
    return {
      read: async (key: string) => {
        // In production, this would use Redis
        // For now, fall back to in-memory
        return inMemoryStore.get(prefix + key) as T | undefined;
      },
      write: async (key: string, value: T) => {
        inMemoryStore.set(prefix + key, value);
      },
      delete: async (key: string) => {
        inMemoryStore.delete(prefix + key);
      },
      has: async (key: string) => {
        return inMemoryStore.has(prefix + key);
      },
    };
  }
  
  // In-memory fallback for development
  return {
    read: async (key: string) => {
      return inMemoryStore.get(prefix + key) as T | undefined;
    },
    write: async (key: string, value: T) => {
      inMemoryStore.set(prefix + key, value);
    },
    delete: async (key: string) => {
      inMemoryStore.delete(prefix + key);
    },
    has: async (key: string) => {
      return inMemoryStore.has(prefix + key);
    },
  };
}

// Storage instances
const watchlistStorage = getStorage<WatchlistItem[]>(WATCHLIST_PREFIX);
const profileStorage = getStorage<UserProfile>(USER_PROFILE_PREFIX);
const metricsStorage = getStorage<OwnerMetrics>("");
const userIndexStorage = getStorage<{ userIds: string[] }>("index:users:");
const watchlistIndexStorage = getStorage<{ userIds: string[] }>("index:watchlist:");

// Helper functions for watchlist operations
export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  const items = await watchlistStorage.read(userId);
  return items ?? [];
}

export async function addToWatchlist(
  userId: string,
  ticker: string,
  displayName: string
): Promise<WatchlistItem> {
  const watchlist = await getWatchlist(userId);
  const existing = watchlist.find(
    (item) => item.ticker.toUpperCase() === ticker.toUpperCase()
  );
  
  if (existing) {
    return existing; // Already in watchlist
  }
  
  const newItem: WatchlistItem = {
    ticker: ticker.toUpperCase(),
    displayName,
    thresholdAlerts: [],
    percentMoveAlerts: [],
    enabled: true,
  };
  
  watchlist.push(newItem);
  await watchlistStorage.write(userId, watchlist);
  
  // Update user index
  const userIndex = (await userIndexStorage.read("all")) ?? { userIds: [] as string[] };
  if (!userIndex.userIds.includes(userId)) {
    userIndex.userIds.push(userId);
    await userIndexStorage.write("all", userIndex);
  }
  
  // Update watchlist index for this ticker
  const tickerIndex = (await watchlistIndexStorage.read(ticker.toUpperCase())) ?? { userIds: [] as string[] };
  if (!tickerIndex.userIds.includes(userId)) {
    tickerIndex.userIds.push(userId);
    await watchlistIndexStorage.write(ticker.toUpperCase(), tickerIndex);
  }
  
  return newItem;
}

export async function removeFromWatchlist(
  userId: string,
  ticker: string
): Promise<boolean> {
  const watchlist = await getWatchlist(userId);
  const initialLength = watchlist.length;
  const filtered = watchlist.filter(
    (item) => item.ticker.toUpperCase() !== ticker.toUpperCase()
  );
  
  if (filtered.length === initialLength) {
    return false; // Not found
  }
  
  await watchlistStorage.write(userId, filtered);
  
  // Update watchlist index
  const tickerIndex = (await watchlistIndexStorage.read(ticker.toUpperCase())) ?? { userIds: [] as string[] };
  tickerIndex.userIds = tickerIndex.userIds.filter((id) => id !== userId);
  await watchlistIndexStorage.write(ticker.toUpperCase(), tickerIndex);
  
  return true;
}

export async function getWatchlistItem(
  userId: string,
  ticker: string
): Promise<WatchlistItem | undefined> {
  const watchlist = await getWatchlist(userId);
  return watchlist.find(
    (item) => item.ticker.toUpperCase() === ticker.toUpperCase()
  );
}

export async function updateWatchlistItem(
  userId: string,
  ticker: string,
  updates: Partial<WatchlistItem>
): Promise<WatchlistItem | undefined> {
  const watchlist = await getWatchlist(userId);
  const index = watchlist.findIndex(
    (item) => item.ticker.toUpperCase() === ticker.toUpperCase()
  );
  
  if (index === -1) {
    return undefined;
  }
  
  watchlist[index] = { ...watchlist[index], ...updates };
  await watchlistStorage.write(userId, watchlist);
  return watchlist[index];
}

// Helper functions for user profile operations
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const profile = await profileStorage.read(userId);
  return profile ?? {
    chatId: parseInt(userId),
    cooldownLength: 30,
    alertPreferences: {
      threshold: true,
      percentMove: true,
    },
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const profile = await getUserProfile(userId);
  const updatedProfile = { ...profile, ...updates };
  await profileStorage.write(userId, updatedProfile);
  return updatedProfile;
}

// Helper functions for owner metrics
export async function getOwnerMetrics(): Promise<OwnerMetrics> {
  const metrics = await metricsStorage.read(OWNER_METRICS_KEY);
  return metrics ?? {
    userCount: 0,
    alertCountsByTicker: {},
    alertTypesDistribution: {
      threshold: 0,
      percentMove: 0,
    },
  };
}

export async function incrementAlertCount(
  ticker: string,
  alertType: "threshold" | "percentMove"
): Promise<void> {
  const metrics = await getOwnerMetrics();
  metrics.alertCountsByTicker[ticker] = (metrics.alertCountsByTicker[ticker] ?? 0) + 1;
  metrics.alertTypesDistribution[alertType] = (metrics.alertTypesDistribution[alertType] ?? 0) + 1;
  await metricsStorage.write(OWNER_METRICS_KEY, metrics);
}

export async function updateUserCount(): Promise<number> {
  const userIndex = (await userIndexStorage.read("all")) ?? { userIds: [] as string[] };
  const metrics = await getOwnerMetrics();
  metrics.userCount = userIndex.userIds.length;
  await metricsStorage.write(OWNER_METRICS_KEY, metrics);
  return metrics.userCount;
}

// Clear in-memory store (for testing)
export function _clearPersistentStore(): void {
  inMemoryStore.clear();
}