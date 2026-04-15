import { useState } from 'react';
import { TrendingUp, Users, FileText, Activity } from 'lucide-react';

function Dashboard() {
  const [stats] = useState([
    { label: 'Total Views', value: '24.5K', change: '+12%', icon: TrendingUp, color: 'blue' },
    { label: 'Active Users', value: '1,234', change: '+5%', icon: Users, color: 'green' },
    { label: 'Documents', value: '456', change: '+8%', icon: FileText, color: 'purple' },
    { label: 'Activity', value: '89%', change: '+2%', icon: Activity, color: 'orange' },
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your activity</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon, color }) => (
          <div 
            key={label} 
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className={`w-10 h-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/20 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{value}</span>
              <span className="text-xs text-green-600 font-medium">{change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
