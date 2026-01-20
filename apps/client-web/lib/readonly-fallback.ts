/**
 * Read-Only Fallback Service
 * 
 * Provides read-only access to cached data when backend is degraded.
 * This allows employees to view their orders and menu even if backend is down.
 */

import { MealDto, OrderDto } from '@contracts/core';

const CACHE_PREFIX = 'chez-noura-cache';
const CACHE_VERSION = '1.0.0';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ReadOnlyFallbackService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if backend is available
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cached meals for a date
   */
  getCachedMeals(date: string): MealDto[] | null {
    const key = `${CACHE_PREFIX}:meals:${date}`;
    const entry = this.getFromStorage<MealDto[]>(key);
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    
    return null;
  }

  /**
   * Cache meals for a date
   */
  cacheMeals(date: string, meals: MealDto[]): void {
    const key = `${CACHE_PREFIX}:meals:${date}`;
    const entry: CacheEntry<MealDto[]> = {
      data: meals,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL,
    };
    this.saveToStorage(key, entry);
  }

  /**
   * Get cached orders
   */
  getCachedOrders(): OrderDto[] | null {
    const key = `${CACHE_PREFIX}:orders`;
    const entry = this.getFromStorage<OrderDto[]>(key);
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    
    return null;
  }

  /**
   * Cache orders
   */
  cacheOrders(orders: OrderDto[]): void {
    const key = `${CACHE_PREFIX}:orders`;
    const entry: CacheEntry<OrderDto[]> = {
      data: orders,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL,
    };
    this.saveToStorage(key, entry);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
    this.cache.clear();
  }

  /**
   * Get from localStorage
   */
  private getFromStorage<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (parsed.version !== CACHE_VERSION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.entry;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        version: CACHE_VERSION,
        entry,
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to cache:', error);
      // If storage is full, try to clear old entries
      this.clearExpiredEntries();
    }
  }

  /**
   * Clear expired entries
   */
  private clearExpiredEntries(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.entry && parsed.entry.expiresAt < now) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Check if we're in degraded mode (backend unavailable)
   */
  async isDegradedMode(): Promise<boolean> {
    return !(await this.checkBackendHealth());
  }
}

export const readOnlyFallback = new ReadOnlyFallbackService();
