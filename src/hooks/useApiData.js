import { useState, useEffect, useCallback, useRef } from 'react';
import { get } from '../services/apiService';
import { fetchWithCache } from '../services/cacheService';

/**
 * Custom hook for fetching data from API endpoints with Firestore caching
 * @param {string} endpoint - API endpoint path (e.g., '/users', '/items/123')
 * @param {Object} params - Optional query parameters
 * @param {boolean} immediate - Whether to fetch immediately on mount (default: true)
 * @param {boolean} useCache - Whether to use Firestore caching (default: true)
 * @returns {Object} { data, loading, error, fromCache, refetch, setData }
 * @example
 * const { data, loading, error, fromCache, refetch } = useApiData('/users', { page: 1 });
 */
export function useApiData(endpoint, params = {}, immediate = true, useCache = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  
  // Use ref to track mounted state for cleanup
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  /**
   * Fetch data with caching support
   */
  const fetchData = useCallback(async (skipCache = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    setFromCache(false);

    try {
      let result;

      // Use cache if enabled and not forcing refresh
      if (useCache && !skipCache) {
        result = await fetchWithCache(endpoint, params, get);
      } else {
        // Direct API call
        const response = await get(endpoint, params);
        result = {
          data: response.success ? response.data : null,
          fromCache: false,
          error: response.success ? null : response.error,
        };
      }
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        if (result.error) {
          setError(result.error);
          setData(null);
        } else {
          setData(result.data);
          setFromCache(result.fromCache);
          setError(null);
        }
      }
    } catch (err) {
      // Only update state if component is still mounted and not aborted
      if (isMounted.current && err.name !== 'AbortError') {
        setError(err.message || 'Network error occurred');
        setData(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint, JSON.stringify(params), useCache]);

  /**
   * Manual refetch function - forces fresh data from API
   */
  const refetch = useCallback(() => {
    setFromCache(false);
    return fetchData(true); // skipCache = true
  }, [fetchData]);

  // Fetch on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, immediate]);

  return {
    data,
    loading,
    error,
    fromCache,
    refetch,
    setData, // Allow manual data updates
  };
}

export default useApiData;
