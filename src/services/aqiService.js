/**
 * AQI Service
 * Handles API calls to OAQ (Open Air Quality) API
 * @module services/aqiService
 */

const API_KEY = import.meta.env.VITE_API_KEY || 'oaq_live_sot6nzxok_mnzvbp21';
const BROKER_URL = 'https://us-central1-oaqdms.cloudfunctions.net/brokerData';
const DATA_URL = 'https://oaq.notf.in';

let sessionSignature = null;
let lastProvider = null;

/**
 * Establish session with API broker
 * @returns {Promise<Object|null>}
 */
export async function establishSession() {
  try {
    console.log('Establishing session with API...');
    const url = `${BROKER_URL}?action=api_session&token=${API_KEY}`;
    console.log('Session URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Session failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Session established:', data);
    sessionSignature = data;
    return data;
  } catch (error) {
    console.error('Session error:', error);
    sessionSignature = null;
    return null;
  }
}

/**
 * Get signed URL for data requests
 * @param {string} path - API path
 * @returns {string}
 */
function getSignedUrl(path) {
  // Check if we have a valid session signature
  if (!sessionSignature) {
    console.warn('No session signature available');
    return `${DATA_URL}/v1/${path}`;
  }
  
  // The API returns the signature as a query string format
  // Example: "URLPrefix=...&Expires=...&KeyName=...&Signature=..."
  if (sessionSignature.signature) {
    const signedUrl = `${DATA_URL}/v1/${path}?${sessionSignature.signature}`;
    console.log('Signed URL (using signature):', signedUrl.substring(0, 120) + '...');
    return signedUrl;
  }
  
  // Fallback: if signature is in a different format, try to construct it
  if (typeof sessionSignature === 'string') {
    const signedUrl = `${DATA_URL}/v1/${path}?${sessionSignature}`;
    return signedUrl;
  }
  
  console.warn('Invalid signature format:', sessionSignature);
  return `${DATA_URL}/v1/${path}`;
}

/**
 * Fetch data from API
 * @param {string} path - API path
 * @returns {Promise<Object>}
 */
async function fetchData(path, retry = true) {
  // Ensure session exists
  if (!sessionSignature) {
    await establishSession();
  }
  
  const url = getSignedUrl(path);
  console.log('Fetching:', url.substring(0, 80) + '...');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      if (response.status === 403 && retry) {
        // Session might have expired, try to re-establish
        console.log('Got 403, retrying with new session...');
        sessionSignature = null;
        await establishSession();
        return fetchData(path, false);
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API response received, stations count:', Object.keys(data?.data || {}).length);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
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
export async function getAllStationsLatest(provider = 'cpcb') {
  // Reset session when provider changes
  if (lastProvider !== provider) {
    sessionSignature = null;
    lastProvider = provider;
  }
  
  try {
    console.log(`Fetching real data for provider: ${provider}`);
    const data = await fetchData(`provider=${provider}/live/global/all_stations_latest.json`);
    
    // Validate that we got real data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }
    
    // Check if data is empty or has the expected structure
    const stations = data.data || data;
    const stationCount = Object.keys(stations).length;
    console.log(`Successfully loaded ${stationCount} stations from ${provider}`);
    
    if (stationCount === 0) {
      throw new Error('No stations returned from API');
    }
    
    return { data: stations };
  } catch (error) {
    console.error(`API failed for ${provider}:`, error);
    console.warn('Falling back to mock data');
    return getMockStationsData(provider);
  }
}

/**
 * Mock data for demonstration when API is unavailable
 * @param {string} provider - Provider ID
 * @returns {Object}
 */
function getMockStationsData(provider = 'cpcb') {
  console.log(`Generating mock data for provider: ${provider}`);
  
  const cities = [
    { name: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.2090, baseAQI: 180 },
    { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, baseAQI: 120 },
    { name: 'Bangalore', country: 'India', lat: 12.9716, lon: 77.5946, baseAQI: 85 },
    { name: 'Chennai', country: 'India', lat: 13.0827, lon: 80.2707, baseAQI: 95 },
    { name: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639, baseAQI: 140 },
    { name: 'Hyderabad', country: 'India', lat: 17.3850, lon: 78.4867, baseAQI: 110 },
    { name: 'Pune', country: 'India', lat: 18.5204, lon: 73.8567, baseAQI: 90 },
    { name: 'Ahmedabad', country: 'India', lat: 23.0225, lon: 72.5714, baseAQI: 130 },
    { name: 'Jaipur', country: 'India', lat: 26.9124, lon: 75.7873, baseAQI: 145 },
    { name: 'Lucknow', country: 'India', lat: 26.8467, lon: 80.9462, baseAQI: 160 },
    { name: 'Kanpur', country: 'India', lat: 26.4499, lon: 80.3319, baseAQI: 175 },
    { name: 'Nagpur', country: 'India', lat: 21.1458, lon: 79.0882, baseAQI: 100 },
    { name: 'Patna', country: 'India', lat: 25.5941, lon: 85.1376, baseAQI: 165 },
    { name: 'Indore', country: 'India', lat: 22.7196, lon: 75.8577, baseAQI: 105 },
    { name: 'Thane', country: 'India', lat: 19.2183, lon: 72.9781, baseAQI: 115 },
  ];

  const data = {};
  const now = Math.floor(Date.now() / 1000);

  cities.forEach((city, index) => {
    const id = `station_${index}`;
    const variation = Math.random() * 40 - 20;
    const pm25 = Math.max(5, city.baseAQI * 0.6 + variation);
    const pm10 = Math.max(10, city.baseAQI * 1.2 + variation * 1.5);
    
    data[id] = {
      name: `${city.name} Central`,
      place: `${city.name} Monitoring Station`,
      city: city.name,
      country: city.country,
      lat: city.lat + (Math.random() - 0.5) * 0.1,
      lon: city.lon + (Math.random() - 0.5) * 0.1,
      provider: provider,
      last_updated: now,
      readings: {
        pm25: Math.round(pm25 * 10) / 10,
        pm10: Math.round(pm10 * 10) / 10,
        o3: Math.round((20 + Math.random() * 40) * 10) / 10,
        no2: Math.round((15 + Math.random() * 35) * 10) / 10,
        so2: Math.round((5 + Math.random() * 20) * 10) / 10,
        co: Math.round((0.5 + Math.random() * 1.5) * 100) / 100
      }
    };
  });

  return { data };
}

/**
 * Get last 24h data for a specific sensor
 * @param {string} provider - Provider ID
 * @param {string} id - Sensor ID
 * @returns {Promise<Object>}
 */
export async function getSensorLast24h(provider = 'openaq', id) {
  try {
    return await fetchData(`provider=${provider}/live/sensors/${id}/last24h.json`);
  } catch (error) {
    console.warn('API failed, using mock trend data:', error);
    return getMockSensorData(id);
  }
}

/**
 * Mock sensor 24h data
 * @param {string} id - Sensor ID
 * @returns {Object}
 */
function getMockSensorData(id) {
  const readings = [];
  const now = Math.floor(Date.now() / 1000);
  const baseAQI = 100 + Math.random() * 100;
  
  // Generate 24h of readings (every 15 minutes = 96 points)
  for (let i = 96; i >= 0; i--) {
    const time = now - i * 15 * 60;
    // Create a daily pattern: higher in morning/evening, lower at night
    const hour = new Date(time * 1000).getHours();
    const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
    const variation = isRushHour ? 30 : 10;
    const pm25 = Math.max(5, baseAQI * 0.5 + (Math.random() - 0.5) * variation);
    
    readings.push({
      time,
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm25 * 2 * 10) / 10,
      o3: Math.round((20 + Math.random() * 40) * 10) / 10,
      no2: Math.round((15 + Math.random() * 35) * 10) / 10,
      so2: Math.round((5 + Math.random() * 20) * 10) / 10,
      co: Math.round((0.5 + Math.random() * 1.5) * 100) / 100
    });
  }
  
  return {
    data: {
      id,
      name: 'Demo Station',
      city: 'Demo City',
      country: 'India',
      provider: 'openaq',
      last_updated: now,
      readings
    }
  };
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

/**
 * Search stations by city or name
 * @param {Array} stations - Array of station objects
 * @param {string} query - Search query
 * @returns {Array} Filtered stations
 */
export function searchStations(stations, query) {
  if (!query || query.trim() === '') return stations;
  
  const lowerQuery = query.toLowerCase().trim();
  return stations.filter(station => {
    const nameMatch = station.name?.toLowerCase().includes(lowerQuery);
    const cityMatch = station.city?.toLowerCase().includes(lowerQuery);
    const countryMatch = station.country?.toLowerCase().includes(lowerQuery);
    return nameMatch || cityMatch || countryMatch;
  });
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
  getAQIInfo,
  searchStations
};
