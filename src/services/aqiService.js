/**
 * AQI Service
 * Handles API calls to OAQ (Open Air Quality) API
 * @module services/aqiService
 */

const API_KEY = import.meta.env.VITE_API_KEY || 'oaq_live_sot6nzxok_mnzvbp21';
const BROKER_URL = 'https://us-central1-oaqdms.cloudfunctions.net/brokerData';
const DATA_URL = 'https://oaq.notf.in';

let sessionSignature = null;

/**
 * Establish session with API broker
 * @returns {Promise<boolean>}
 */
export async function establishSession() {
  try {
    const response = await fetch(`${BROKER_URL}?action=api_session&token=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to establish session');
    
    const data = await response.json();
    sessionSignature = data;
    return true;
  } catch (error) {
    console.error('Session error:', error);
    return false;
  }
}

/**
 * Get signed URL for data requests
 * @param {string} path - API path
 * @returns {string}
 */
function getSignedUrl(path) {
  if (!sessionSignature) return `${DATA_URL}/v1/${path}`;
  
  const { Signature, Expires, KeyName } = sessionSignature;
  return `${DATA_URL}/v1/${path}?Signature=${Signature}&Expires=${Expires}&KeyName=${KeyName}`;
}

/**
 * Fetch data from API
 * @param {string} path - API path
 * @returns {Promise<Object>}
 */
async function fetchData(path) {
  // Ensure session exists
  if (!sessionSignature) {
    await establishSession();
  }
  
  const url = getSignedUrl(path);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get provider hierarchy (Country > City > Sensor)
 * @param {string} provider - Provider ID
 * @returns {Promise<Object>}
 */
export async function getProviderHierarchy(provider = 'openaq') {
  return fetchData(`provider=${provider}/meta/hierarchy.json`);
}

/**
 * Get latest readings for all sensors in a city
 * @param {string} provider - Provider ID
 * @param {string} city - City name (lowercase)
 * @returns {Promise<Object>}
 */
export async function getCityLatest(provider = 'openaq', city = 'delhi') {
  return fetchData(`provider=${provider}/live/by_city/${city.toLowerCase()}/map_latest.json`);
}

/**
 * Get latest readings for all stations under provider
 * @param {string} provider - Provider ID
 * @returns {Promise<Object>}
 */
export async function getAllStationsLatest(provider = 'openaq') {
  return fetchData(`provider=${provider}/live/global/all_stations_latest.json`);
}

/**
 * Get last 24h data for a specific sensor
 * @param {string} provider - Provider ID
 * @param {string} id - Sensor ID
 * @returns {Promise<Object>}
 */
export async function getSensorLast24h(provider = 'openaq', id) {
  return fetchData(`provider=${provider}/live/sensors/${id}/last24h.json`);
}

/**
 * Get daily historical data
 * @param {string} provider - Provider ID
 * @param {string} id - Sensor ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Object>}
 */
export async function getDailyHistory(provider = 'openaq', id, year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return fetchData(`provider=${provider}/history/daily/${id}/${year}/${m}/${d}.json`);
}

/**
 * Get monthly aggregates
 * @param {string} provider - Provider ID
 * @param {string} id - Sensor ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>}
 */
export async function getMonthlyAggregates(provider = 'openaq', id, year, month) {
  const m = String(month).padStart(2, '0');
  return fetchData(`provider=${provider}/history/aggregates/${id}/monthly_${year}_${m}.json`);
}

/**
 * Calculate AQI from pollutant values
 * @param {Object} values - Pollutant values (pm25, pm10, o3, no2, so2, co)
 * @returns {number} AQI value (0-500)
 */
export function calculateAQI(values = {}) {
  const breakpoints = {
    pm25: [
      [0, 12, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 500.4, 301, 500]
    ],
    pm10: [
      [0, 54, 0, 50],
      [55, 154, 51, 100],
      [155, 254, 101, 150],
      [255, 354, 151, 200],
      [355, 424, 201, 300],
      [425, 604, 301, 500]
    ]
  };
  
  let maxAQI = 0;
  
  for (const [pollutant, value] of Object.entries(values)) {
    if (!breakpoints[pollutant] || !value) continue;
    
    for (const [low, high, aqiLow, aqiHigh] of breakpoints[pollutant]) {
      if (value >= low && value <= high) {
        const aqi = ((aqiHigh - aqiLow) / (high - low)) * (value - low) + aqiLow;
        maxAQI = Math.max(maxAQI, aqi);
        break;
      }
    }
  }
  
  return Math.round(maxAQI);
}

/**
 * Get AQI color and description
 * @param {number} aqi - AQI value
 * @returns {Object} { color, bgColor, textColor, description, level }
 */
export function getAQIInfo(aqi) {
  if (aqi <= 50) {
    return { 
      color: '#22c55e', 
      bgColor: 'bg-green-500',
      textColor: 'text-green-700',
      description: 'Good',
      level: 1
    };
  }
  if (aqi <= 100) {
    return { 
      color: '#eab308', 
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      description: 'Moderate',
      level: 2
    };
  }
  if (aqi <= 150) {
    return { 
      color: '#f97316', 
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-700',
      description: 'Unhealthy for Sensitive Groups',
      level: 3
    };
  }
  if (aqi <= 200) {
    return { 
      color: '#ef4444', 
      bgColor: 'bg-red-500',
      textColor: 'text-red-700',
      description: 'Unhealthy',
      level: 4
    };
  }
  if (aqi <= 300) {
    return { 
      color: '#a855f7', 
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-700',
      description: 'Very Unhealthy',
      level: 5
    };
  }
  return { 
    color: '#7f1d1d', 
    bgColor: 'bg-red-900',
    textColor: 'text-red-900',
    description: 'Hazardous',
    level: 6
  };
}

export default {
  establishSession,
  getProviderHierarchy,
  getCityLatest,
  getAllStationsLatest,
  getSensorLast24h,
  getDailyHistory,
  getMonthlyAggregates,
  calculateAQI,
  getAQIInfo
};
