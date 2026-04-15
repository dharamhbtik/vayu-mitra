/**
 * API Service
 * Handles all HTTP requests to the OAQ API
 * @module services/apiService
 */

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = 'https://oaq.notf.in/api';
const API_KEY = 'oaq_live_sot6nzxok_mnzvbp21';
const RATE_LIMIT = 100; // requests per minute

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Key': API_KEY,
};

// ============================================================================
// Rate Limiting
// ============================================================================

const requestTimestamps = [];
const MINUTE_MS = 60000;

/**
 * Check and enforce rate limit (100 requests per minute)
 * Waits if limit would be exceeded
 * @returns {Promise<void>}
 */
async function enforceRateLimit() {
  const now = Date.now();
  const windowStart = now - MINUTE_MS;
  
  // Remove timestamps outside the current window
  const validTimestamps = requestTimestamps.filter(ts => ts > windowStart);
  requestTimestamps.length = 0;
  requestTimestamps.push(...validTimestamps);
  
  // If at limit, wait until oldest request falls outside window
  if (requestTimestamps.length >= RATE_LIMIT) {
    const oldestTimestamp = requestTimestamps[0];
    const waitTime = oldestTimestamp + MINUTE_MS - now;
    
    if (waitTime > 0) {
      console.warn(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Recursively check again after waiting
      return enforceRateLimit();
    }
  }
  
  // Record this request
  requestTimestamps.push(Date.now());
}

/**
 * Get current rate limit status
 * @returns {Object} { used, remaining, resetIn }
 */
export function getRateLimitStatus() {
  const now = Date.now();
  const windowStart = now - MINUTE_MS;
  const used = requestTimestamps.filter(ts => ts > windowStart).length;
  
  return {
    used,
    remaining: Math.max(0, RATE_LIMIT - used),
    resetIn: requestTimestamps.length > 0 
      ? Math.max(0, requestTimestamps[0] + MINUTE_MS - now)
      : 0,
  };
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} data - The response data (null if error)
 * @property {string|null} error - Error message (null if success)
 * @property {number} status - HTTP status code
 */

// ============================================================================
// Core HTTP Functions
// ============================================================================

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<ApiResponse>} Structured response object
 */
async function fetchApi(endpoint, options = {}) {
  // Enforce rate limiting before making request
  await enforceRateLimit();
  
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const status = response.status;
    
    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP ${status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        data: null,
        error: errorMessage,
        status,
      };
    }

    // Parse successful response
    let data = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: true,
      data,
      error: null,
      status,
    };

  } catch (networkError) {
    return {
      success: false,
      data: null,
      error: networkError.message || 'Network error occurred',
      status: 0,
    };
  }
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * GET request to fetch data
 * @param {string} endpoint - API endpoint (e.g., '/users', '/items/123')
 * @param {Object} params - Query parameters
 * @returns {Promise<ApiResponse>} Response object
 * @example
 * const response = await apiService.get('/users', { page: 1, limit: 10 });
 * if (response.success) {
 *   console.log(response.data);
 * }
 */
export async function get(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  
  return fetchApi(url, {
    method: 'GET',
  });
}

/**
 * POST request to create a new resource
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body data
 * @returns {Promise<ApiResponse>} Response object
 * @example
 * const response = await apiService.post('/users', { name: 'John', email: 'john@example.com' });
 */
export async function post(endpoint, body = {}) {
  return fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request to fully update a resource
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body data
 * @returns {Promise<ApiResponse>} Response object
 * @example
 * const response = await apiService.put('/users/123', { name: 'Jane', email: 'jane@example.com' });
 */
export async function put(endpoint, body = {}) {
  return fetchApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request to partially update a resource
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body data (partial fields)
 * @returns {Promise<ApiResponse>} Response object
 * @example
 * const response = await apiService.patch('/users/123', { name: 'Updated Name' });
 */
export async function patch(endpoint, body = {}) {
  return fetchApi(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request to remove a resource
 * @param {string} endpoint - API endpoint
 * @returns {Promise<ApiResponse>} Response object
 * @example
 * const response = await apiService.remove('/users/123');
 */
export async function remove(endpoint) {
  return fetchApi(endpoint, {
    method: 'DELETE',
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Update default headers (e.g., add auth token)
 * @param {Object} headers - Headers to add/update
 */
export function setHeaders(headers) {
  Object.assign(defaultHeaders, headers);
}

/**
 * Set authorization token
 * @param {string} token - JWT or API token
 */
export function setAuthToken(token) {
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    delete defaultHeaders['Authorization'];
  }
}

/**
 * Remove authorization token
 */
export function clearAuthToken() {
  delete defaultHeaders['Authorization'];
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  get,
  post,
  put,
  patch,
  remove,
  setHeaders,
  setAuthToken,
  clearAuthToken,
  getRateLimitStatus,
};
