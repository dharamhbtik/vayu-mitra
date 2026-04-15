import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Filter, Layers, X } from 'lucide-react';
import { getAllStationsLatest, getCityLatest, getAQIInfo, calculateAQI } from '../services/aqiService';

// Fix Leaflet default marker icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on AQI
function getAQIMarkerIcon(aqi) {
  const info = getAQIInfo(aqi);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${info.color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${aqi}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

// Map bounds controller
function MapBounds({ stations }) {
  const map = useMap();
  
  useEffect(() => {
    if (stations.length > 0) {
      const bounds = L.latLngBounds(stations.map(s => [s.lat, s.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stations, map]);
  
  return null;
}

function AQIMap() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [provider, setProvider] = useState('openaq');
  const [pmFilter, setPmFilter] = useState('all');
  const [clustering, setClustering] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch stations data
  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (searchCity) {
        data = await getCityLatest(provider, searchCity);
      } else {
        data = await getAllStationsLatest(provider);
      }
      
      // Transform data to stations array
      const stationsData = Object.entries(data?.data || {}).map(([id, station]) => ({
        id,
        lat: station.lat,
        lon: station.lon,
        name: station.name || station.place || id,
        city: station.city,
        country: station.country,
        provider: station.provider,
        readings: station.readings || {},
        aqi: calculateAQI(station.readings || {}),
        lastUpdated: station.last_updated
      }));
      
      setStations(stationsData);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [provider, searchCity]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Filter stations
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // PM filter
      if (pmFilter !== 'all') {
        const pm25 = station.readings?.pm25 || 0;
        if (pmFilter === 'low' && pm25 > 35) return false;
        if (pmFilter === 'moderate' && (pm25 <= 35 || pm25 > 75)) return false;
        if (pmFilter === 'high' && pm25 <= 75) return false;
      }
      
      return true;
    });
  }, [stations, pmFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredStations.length === 0) return null;
    
    const avgAQI = Math.round(
      filteredStations.reduce((sum, s) => sum + s.aqi, 0) / filteredStations.length
    );
    
    const maxAQI = Math.max(...filteredStations.map(s => s.aqi));
    const minAQI = Math.min(...filteredStations.map(s => s.aqi));
    
    return { avgAQI, maxAQI, minAQI, count: filteredStations.length };
  }, [filteredStations]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Air Quality Map</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time AQI monitoring across {stats?.count || 0} stations
            </p>
          </div>
          
          {/* Search */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchStations()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {stats && (
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Average AQI</span>
              <p className="text-xl font-bold text-blue-600">{stats.avgAQI}</p>
            </div>
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Max AQI</span>
              <p className="text-xl font-bold text-red-600">{stats.maxAQI}</p>
            </div>
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Min AQI</span>
              <p className="text-xl font-bold text-green-600">{stats.minAQI}</p>
            </div>
          </div>
        )}
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Provider Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="openaq">OpenAQ</option>
                  <option value="waqi">WAQI</option>
                  <option value="purpleair">PurpleAir</option>
                </select>
              </div>
              
              {/* PM Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PM2.5 Level
                </label>
                <select
                  value={pmFilter}
                  onChange={(e) => setPmFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="low">Low (0-35 μg/m³)</option>
                  <option value="moderate">Moderate (36-75 μg/m³)</option>
                  <option value="high">High (&gt;75 μg/m³)</option>
                </select>
              </div>
              
              {/* Clustering Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Clustering
                </label>
                <button
                  onClick={() => setClustering(!clustering)}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                    clustering
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {clustering ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 dark:text-gray-400">Loading stations...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute top-4 left-4 right-4 z-10 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchStations}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <MapContainer
          center={[20.5937, 78.9629]} // India center
          zoom={5}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds stations={filteredStations} />
          
          {filteredStations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lon]}
              icon={getAQIMarkerIcon(station.aqi)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg">{station.name}</h3>
                  <p className="text-sm text-gray-500">{station.city}, {station.country}</p>
                  
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: getAQIInfo(station.aqi).color + '20' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold" style={{ color: getAQIInfo(station.aqi).color }}>
                        {station.aqi}
                      </span>
                      <span className="text-sm font-medium" style={{ color: getAQIInfo(station.aqi).color }}>
                        {getAQIInfo(station.aqi).description}
                      </span>
                    </div>
                  </div>
                  
                  {station.readings && (
                    <div className="mt-3 space-y-1 text-sm">
                      {station.readings.pm25 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">PM2.5:</span>
                          <span className="font-medium">{station.readings.pm25} μg/m³</span>
                        </div>
                      )}
                      {station.readings.pm10 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">PM10:</span>
                          <span className="font-medium">{station.readings.pm10} μg/m³</span>
                        </div>
                      )}
                      {station.readings.o3 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">O3:</span>
                          <span className="font-medium">{station.readings.o3} ppb</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-gray-400">
                    Last updated: {new Date(station.lastUpdated * 1000).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* AQI Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[400]">
          <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">AQI Levels</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-gray-700 dark:text-gray-300">0-50 Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">51-100 Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-gray-700 dark:text-gray-300">101-150 Sensitive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-gray-700 dark:text-gray-300">151-200 Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-gray-700 dark:text-gray-300">201-300 Very Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-900" />
              <span className="text-gray-700 dark:text-gray-300">300+ Hazardous</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AQIMap;
