/**
 * Cache Service
 * Manages API response caching in Firestore with 10-minute TTL
 * @module services/cacheService
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CACHE_TTL_MINUTES = 10;
const CACHE_TTL_MS = CACHE_TTL_MINUTES * 60 * 1000;
const CACHE_COLLECTION = 'cache';

/**
 * Generate a document ID from endpoint and params
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {string} Document ID
 */
function generateCacheKey(endpoint, params = {}) {
  const paramsString = Object.keys(params).length > 0 
    ? '_' + JSON.stringify(params).replace(/[^a-zA-Z0-9]/g, '_')
    : '';
  // Remove leading slash and replace special chars
  const cleanEndpoint = endpoint.replace(/^\//, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${cleanEndpoint}${paramsString}`.substring(0, 100);
}

/**
 * Check if cached data is still valid (within 10 minutes)
 * @param {Timestamp} cachedAt - Firestore timestamp
 * @returns {boolean}
 */
function isCacheValid(cachedAt) {
  if (!cachedAt) return false;
  
  const cachedTime = cachedAt instanceof Timestamp 
    ? cachedAt.toMillis() 
    : new Date(cachedAt).getTime();
  
  return (Date.now() - cachedTime) < CACHE_TTL_MS;
}

/**
 * Get cached data from Firestore
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<{data: any, cachedAt: Timestamp}|null>}
 */
export async function getCachedData(endpoint, params = {}) {
  try {
    const cacheKey = generateCacheKey(endpoint, params);
    const cacheRef = doc(db, CACHE_COLLECTION, cacheKey);
    const snapshot = await getDoc(cacheRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const cached = snapshot.data();
    
    // Check if cache is still valid
    if (!isCacheValid(cached.cachedAt)) {
      return null;
    }
    
    return {
      data: cached.data,
      cachedAt: cached.cachedAt,
    };
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Save data to Firestore cache
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @param {any} data - Data to cache
 * @returns {Promise<boolean>}
 */
export async function setCachedData(endpoint, params = {}, data) {
  try {
    const cacheKey = generateCacheKey(endpoint, params);
    const cacheRef = doc(db, CACHE_COLLECTION, cacheKey);
    
    await setDoc(cacheRef, {
      data,
      endpoint,
      params,
      cachedAt: serverTimestamp(),
      ttl: CACHE_TTL_MINUTES,
    });
    
    return true;
  } catch (error) {
    console.error('Cache write error:', error);
    return false;
  }
}

/**
 * Fetch with cache - checks Firestore first, falls back to API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @param {Function} fetchFn - Function to fetch fresh data (e.g., apiService.get)
 * @returns {Promise<{data: any, fromCache: boolean}>}
 * @example
 * const { data, fromCache } = await fetchWithCache('/users', { page: 1 }, apiService.get);
 */
export async function fetchWithCache(endpoint, params = {}, fetchFn) {
  // 1. Check Firestore cache first
  const cached = await getCachedData(endpoint, params);
  
  if (cached) {
    console.log(`[Cache] HIT for ${endpoint}`, params);
    return {
      data: cached.data,
      fromCache: true,
      cachedAt: cached.cachedAt,
    };
  }
  
  // 2. Cache miss - fetch from API
  console.log(`[Cache] MISS for ${endpoint}`, params);
  const response = await fetchFn(endpoint, params);
  
  if (!response.success) {
    return {
      data: null,
      fromCache: false,
      error: response.error,
    };
  }
  
  // 3. Save to Firestore cache
  await setCachedData(endpoint, params, response.data);
  
  return {
    data: response.data,
    fromCache: false,
  };
}

/**
 * Clear specific cache entry
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<boolean>}
 */
export async function clearCache(endpoint, params = {}) {
  try {
    const cacheKey = generateCacheKey(endpoint, params);
    const cacheRef = doc(db, CACHE_COLLECTION, cacheKey);
    await setDoc(cacheRef, { data: null, cachedAt: null });
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
}

/**
 * Clear all cache (use with caution - deletes entire cache collection)
 * @returns {Promise<boolean>}
 */
export async function clearAllCache() {
  // This would require listing all docs and batch deleting
  // For safety, we'll just log a warning
  console.warn('clearAllCache not implemented to prevent accidental data loss');
  return false;
}

export default {
  getCachedData,
  setCachedData,
  fetchWithCache,
  clearCache,
  clearAllCache,
  CACHE_TTL_MINUTES,
};
