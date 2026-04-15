import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Clock, Calendar, RefreshCw, Search } from 'lucide-react';
import { getSensorLast24h, getAQIInfo, calculateAQI } from '../services/aqiService';

const TIME_RANGES = [
  { value: '10m', label: '10 Minutes', interval: 1 },
  { value: '20m', label: '20 Minutes', interval: 2 },
  { value: '1h', label: '1 Hour', interval: 4 },
  { value: '2h', label: '2 Hours', interval: 8 },
  { value: '6h', label: '6 Hours', interval: 24 },
  { value: '12h', label: '12 Hours', interval: 48 },
  { value: '24h', label: '24 Hours', interval: 96 }
];

function AQITrends() {
  const [sensorId, setSensorId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [provider, setProvider] = useState('openaq');
  const [sensorInfo, setSensorInfo] = useState(null);

  const fetchTrends = useCallback(async () => {
    if (!sensorId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSensorLast24h(provider, sensorId);
      
      if (!response?.data) {
        throw new Error('No data available for this sensor');
      }
      
      const sensorData = response.data;
      setSensorInfo({
        name: sensorData.name,
        city: sensorData.city,
        country: sensorData.country,
        provider: sensorData.provider
      });
      
      // Process readings based on time range
      const readings = sensorData.readings || [];
      const range = TIME_RANGES.find(r => r.value === timeRange);
      const interval = range?.interval || 96;
      
      // Filter and aggregate readings
      const now = Date.now() / 1000;
      const rangeSeconds = parseInt(timeRange) * (timeRange.includes('h') ? 3600 : 60);
      const cutoffTime = now - rangeSeconds;
      
      const filteredReadings = readings.filter(r => r.time >= cutoffTime);
      
      // Aggregate by interval
      const aggregated = [];
      for (let i = 0; i < filteredReadings.length; i += interval) {
        const slice = filteredReadings.slice(i, i + interval);
        const avgReading = {
          time: slice[Math.floor(slice.length / 2)].time,
          pm25: slice.reduce((sum, r) => sum + (r.pm25 || 0), 0) / slice.length,
          pm10: slice.reduce((sum, r) => sum + (r.pm10 || 0), 0) / slice.length,
          o3: slice.reduce((sum, r) => sum + (r.o3 || 0), 0) / slice.length,
          no2: slice.reduce((sum, r) => sum + (r.no2 || 0), 0) / slice.length,
          so2: slice.reduce((sum, r) => sum + (r.so2 || 0), 0) / slice.length,
          co: slice.reduce((sum, r) => sum + (r.co || 0), 0) / slice.length
        };
        avgReading.aqi = calculateAQI(avgReading);
        aggregated.push(avgReading);
      }
      
      // Format for chart
      const chartData = aggregated.map(r => ({
        time: new Date(r.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: new Date(r.time * 1000).toLocaleString(),
        aqi: Math.round(r.aqi),
        pm25: Math.round(r.pm25 * 10) / 10,
        pm10: Math.round(r.pm10 * 10) / 10,
        o3: Math.round(r.o3 * 10) / 10,
        no2: Math.round(r.no2 * 10) / 10,
        so2: Math.round(r.so2 * 10) / 10,
        co: Math.round(r.co * 10) / 10,
        color: getAQIInfo(r.aqi).color
      }));
      
      setData(chartData);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sensorId, provider, timeRange]);

  useEffect(() => {
    if (sensorId) {
      fetchTrends();
    }
  }, [sensorId, timeRange, fetchTrends]);

  const handleSearch = () => {
    setSensorId(searchId);
  };

  // Calculate stats
  const stats = data.length > 0 ? {
    avg: Math.round(data.reduce((sum, d) => sum + d.aqi, 0) / data.length),
    max: Math.max(...data.map(d => d.aqi)),
    min: Math.min(...data.map(d => d.aqi)),
    current: data[data.length - 1]?.aqi || 0
  } : null;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AQI Trends & Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor air quality changes over time for specific locations
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sensor ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter sensor ID (e.g., 12345)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchId || loading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="openaq">OpenAQ</option>
              <option value="waqi">WAQI</option>
              <option value="purpleair">PurpleAir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sensor Info */}
      {sensorInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">{sensorInfo.name}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {sensorInfo.city}, {sensorInfo.country} • {sensorInfo.provider}
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={fetchTrends}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Time Range Selector */}
      {data.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Range
          </label>
          <div className="flex flex-wrap gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Current AQI</span>
            </div>
            <p className={`text-2xl font-bold ${getAQIInfo(stats.current).textColor}`}>
              {stats.current}
            </p>
            <p className="text-xs text-gray-500">{getAQIInfo(stats.current).description}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Average AQI</span>
            </div>
            <p className={`text-2xl font-bold ${getAQIInfo(stats.avg).textColor}`}>
              {stats.avg}
            </p>
            <p className="text-xs text-gray-500">Over selected period</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Peak AQI</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.max}</p>
            <p className="text-xs text-gray-500">Highest in period</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Lowest AQI</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.min}</p>
            <p className="text-xs text-gray-500">Best air quality</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {data.length > 0 && (
        <div className="space-y-6">
          {/* AQI Trend */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AQI Trend
            </h3>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9ca3af"
                    fontSize={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="aqi" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#aqiGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PM Trend */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Particulate Matter (PM) Trend
            </h3>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9ca3af"
                    fontSize={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pm25" 
                    name="PM2.5"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pm10" 
                    name="PM10"
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">PM2.5 (μg/m³)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-orange-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">PM10 (μg/m³)</span>
              </div>
            </div>
          </div>

          {/* Other Pollutants */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Other Pollutants
            </h3>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9ca3af"
                    fontSize={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#9ca3af' }
                    }
                  />
                  <Line 
                    type="monotone" 
                    dataKey="o3" 
                    name="O₃"
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="no2" 
                    name="NO₂"
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="so2" 
                    name="SO₂"
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">O₃ (ppb)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">NO₂ (ppb)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">SO₂ (ppb)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!sensorId && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Enter a Sensor ID
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Search for a sensor ID from the map view or enter one manually to see AQI trends and historical data.
          </p>
        </div>
      )}
    </div>
  );
}

export default AQITrends;
