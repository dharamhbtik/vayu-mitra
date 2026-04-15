import { useState, useEffect, useCallback, useRef } from 'react';
import { get } from '../services/apiService';

/**
 * Custom hook for fetching data from API endpoints
 * @param {string} endpoint - API endpoint path (e.g., '/users', '/items/123')
 * @param {Object} params - Optional query parameters
 * @param {boolean} immediate - Whether to fetch immediately on mount (default: true)
 * @returns {Object} { data, loading, error, refetch, setData }
 * @example
 * const { data, loading, error, refetch } = useApiData('/users', { page: 1 });
 */
export function useApiData(endpoint, params = {}, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  
  // Use ref to track mounted state for cleanup
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  /**
   * Fetch data from the API endpoint
   */
  const fetchData = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await get(endpoint, params);
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        if (response.success) {
          setData(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch data');
          setData(null);
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
  }, [endpoint, JSON.stringify(params)]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    return fetchData();
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
    refetch,
    setData, // Allow manual data updates
  };
}

export default useApiData;
