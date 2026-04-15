import { useEffect, useState, useMemo } from 'react';
import { MapPin, Wind, Droplets, Thermometer, AlertCircle, RefreshCw, Info, Filter, Map as MapIcon, List, Search } from 'lucide-react';
import { getAllStationsLatest, getAQIInfo, calculateAQI } from '../services/aqiService';
import AQIMap from './AQIMap';

const PROVIDERS = [
  { value: 'openaq', label: 'OpenAQ' },
  { value: 'cpcb', label: 'CPCB (India)' },
  { value: 'waqi', label: 'WAQI' },
  { value: 'purpleair', label: 'PurpleAir' },
];

const PM_FILTERS = [
  { value: 'all', label: 'All PM2.5 Levels' },
  { value: 'good', label: 'Good (0-35 μg/m³)', max: 35 },
  { value: 'moderate', label: 'Moderate (36-75 μg/m³)', min: 36, max: 75 },
  { value: 'unhealthy', label: 'Unhealthy (>75 μg/m³)', min: 75 },
];

function AQIDashboard() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [provider, setProvider] = useState('cpcb');
  const [pmFilter, setPmFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  const fetchData = async (selectedProvider = provider) => {
    try {
      setLoading(true);
      setError(null);
      setIsDemo(false);
      
      const response = await getAllStationsLatest(selectedProvider);
      
      if (!response?.data) {
        throw new Error('Unable to load air quality data');
      }
      
      const isMockData = Object.keys(response.data).some(id => id.startsWith('station_'));
      setIsDemo(isMockData);
      
      const stationsData = Object.entries(response.data).map(([id, station]) => ({
        id,
        name: station.name || station.place || 'Unknown Location',
        city: station.city || 'Unknown City',
        country: station.country || '',
        lat: station.lat,
        lon: station.lon,
        readings: station.readings || {},
        aqi: calculateAQI(station.readings || {}),
        lastUpdated: station.last_updated
      }));
      
      stationsData.sort((a, b) => b.aqi - a.aqi);
      setStations(stationsData);
      
      if (userLocation && stationsData.length > 0) {
        const nearest = findNearestStation(userLocation, stationsData);
        setSelectedStation(nearest);
      } else if (stationsData.length > 0) {
        setSelectedStation(stationsData[0]);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load air quality data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => console.log('Location access denied')
      );
    }
  }, []);

  useEffect(() => {
    fetchData(provider);
  }, [provider]);

  const filteredStations = useMemo(() => {
    if (pmFilter === 'all') return stations;
    const filter = PM_FILTERS.find(f => f.value === pmFilter);
    if (!filter) return stations;
    return stations.filter(station => {
      const pm25 = station.readings?.pm25 || 0;
      if (filter.max && pm25 > filter.max) return false;
      if (filter.min && pm25 < filter.min) return false;
      return true;
    });
  }, [stations, pmFilter]);

  const stats = {
    total: filteredStations.length,
    avgAQI: filteredStations.length > 0 
      ? Math.round(filteredStations.reduce((sum, s) => sum + s.aqi, 0) / filteredStations.length)
      : 0,
    good: filteredStations.filter(s => s.aqi <= 50).length,
    moderate: filteredStations.filter(s => s.aqi > 50 && s.aqi <= 100).length,
    unhealthy: filteredStations.filter(s => s.aqi > 100).length
  };

  const selectedInfo = selectedStation ? getAQIInfo(selectedStation.aqi) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Air Quality Monitor</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Real-time air quality index from {stats.total} monitoring stations
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              
              <select
                value={pmFilter}
                onChange={(e) => setPmFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {PM_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => fetchData(provider)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isDemo && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-amber-700 dark:text-amber-300">
              <strong>Demo Mode:</strong> Showing simulated data for {provider.toUpperCase()}. Live API temporarily unavailable.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => fetchData(provider)} className="ml-auto text-sm font-medium text-red-700 hover:underline">Retry</button>
          </div>
        )}

        {loading && !stations.length && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-slate-500">Loading...</p>
          </div>
        )}

        {filteredStations.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Average AQI" value={stats.avgAQI} color={getAQIColor(stats.avgAQI)} subtext={getAQIInfo(stats.avgAQI).description} />
              <StatCard label="Good" value={stats.good} color="green" subtext={`${Math.round(stats.good/stats.total*100) || 0}%`} />
              <StatCard label="Moderate" value={stats.moderate} color="yellow" subtext={`${Math.round(stats.moderate/stats.total*100) || 0}%`} />
              <StatCard label="Unhealthy" value={stats.unhealthy} color="red" subtext={`${Math.round(stats.unhealthy/stats.total*100) || 0}%`} />
            </div>

            {viewMode === 'map' ? (
              <div className="space-y-4">
                {/* Search Bar for Map */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search for a city or place..."
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600">
                    <span>PM2.5 Levels</span>
                  </div>
                </div>
                
                {/* Map Component */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ height: '600px' }}>
                  <AQIMap 
                    stations={filteredStations} 
                    selectedStation={selectedStation}
                    onSelectStation={setSelectedStation}
                  />
                </div>
                
                {/* PM2.5 Legend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">PM2.5 Levels</span>
                    <span className="text-xs text-slate-500">μg/m³</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {[
                      { color: '#22c55e', label: 'Good', range: '0-35' },
                      { color: '#eab308', label: 'Satisfactory', range: '36-75' },
                      { color: '#f97316', label: 'Moderate', range: '76-100' },
                      { color: '#ef4444', label: 'Poor', range: '101-150' },
                      { color: '#a855f7', label: 'Very Poor', range: '151-200' },
                      { color: '#7f1d1d', label: 'Severe', range: '200+' },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center gap-1 flex-1">
                        <div 
                          className="w-full h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 text-center">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  {selectedStation ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="p-8 text-center" style={{ backgroundColor: selectedInfo.color + '15' }}>
                        <div className="text-7xl font-bold mb-2" style={{ color: selectedInfo.color }}>
                          {selectedStation.aqi}
                        </div>
                        <div className="text-lg font-medium mb-1" style={{ color: selectedInfo.color }}>
                          {selectedInfo.description}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStation.name}</p>
                      </div>

                      <div className="p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Pollutant Levels</h3>
                        <PollutantRow icon={<Wind className="w-4 h-4" />} label="PM2.5" value={selectedStation.readings.pm25} unit="μg/m³" threshold={35} />
                        <PollutantRow icon={<Wind className="w-4 h-4" />} label="PM10" value={selectedStation.readings.pm10} unit="μg/m³" threshold={150} />
                        <PollutantRow icon={<Droplets className="w-4 h-4" />} label="Ozone (O₃)" value={selectedStation.readings.o3} unit="ppb" threshold={70} />
                        <PollutantRow icon={<Thermometer className="w-4 h-4" />} label="NO₂" value={selectedStation.readings.no2} unit="ppb" threshold={100} />
                      </div>

                      <div className="px-6 pb-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            <strong>Health Advice:</strong> {getHealthAdvice(selectedStation.aqi)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">AQI Scale</h3>
                    <div className="space-y-2">
                      {[
                        { range: '0-50', label: 'Good', color: '#22c55e' },
                        { range: '51-100', label: 'Moderate', color: '#eab308' },
                        { range: '101-150', label: 'Unhealthy for Sensitive', color: '#f97316' },
                        { range: '151-200', label: 'Unhealthy', color: '#ef4444' },
                        { range: '201-300', label: 'Very Unhealthy', color: '#a855f7' },
                        { range: '300+', label: 'Hazardous', color: '#7f1d1d' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-slate-500 w-12">{item.range}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Monitoring Stations</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Click on a station to view details</p>
                    </div>
                    
                    <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                      {filteredStations.map((station) => {
                        const info = getAQIInfo(station.aqi);
                        return (
                          <button
                            key={station.id}
                            onClick={() => setSelectedStation(station)}
                            className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                              selectedStation?.id === station.id 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-900 dark:text-white">{station.name}</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 ml-6">
                                  {station.city}{station.country ? `, ${station.country}` : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: info.color }}>
                                  {station.aqi}
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: info.color }}>
                                  {info.description}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color, subtext }) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
  };

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color] || colorClasses.green}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs mt-1 opacity-70">{subtext}</p>
    </div>
  );
}

function PollutantRow({ icon, label, value, unit, threshold }) {
  const numValue = parseFloat(value) || 0;
  const isHigh = numValue > threshold;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-slate-400">{icon}</span>
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-semibold ${isHigh ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
          {value || '--'}
        </span>
        <span className="text-xs text-slate-400 ml-1">{unit}</span>
        {isHigh && <span className="text-xs text-red-500 ml-2">High</span>}
      </div>
    </div>
  );
}

function getAQIColor(aqi) {
  if (aqi <= 50) return 'green';
  if (aqi <= 100) return 'yellow';
  if (aqi <= 150) return 'orange';
  if (aqi <= 200) return 'red';
  if (aqi <= 300) return 'purple';
  return 'red';
}

function getHealthAdvice(aqi) {
  if (aqi <= 50) return 'Air quality is satisfactory. Enjoy outdoor activities!';
  if (aqi <= 100) return 'Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.';
  if (aqi <= 150) return 'Members of sensitive groups may experience health effects. Consider wearing a mask outdoors.';
  if (aqi <= 200) return 'Everyone may begin to experience health effects. Avoid prolonged outdoor activities.';
  if (aqi <= 300) return 'Health alert: everyone may experience more serious health effects. Stay indoors if possible.';
  return 'Health warnings of emergency conditions. Everyone should avoid all outdoor exertion.';
}

function findNearestStation(userLoc, stations) {
  return stations.reduce((nearest, station) => {
    const dist = Math.sqrt(
      Math.pow(station.lat - userLoc.lat, 2) + 
      Math.pow(station.lon - userLoc.lon, 2)
    );
    if (!nearest || dist < nearest.dist) {
      return { ...station, dist };
    }
    return nearest;
  }, null);
}

export default AQIDashboard;
