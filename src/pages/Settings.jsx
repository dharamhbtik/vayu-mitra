import { useState } from 'react'

function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    locationServices: false,
    autoUpdate: true,
  })

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const settingItems = [
    { key: 'notifications', label: 'Push Notifications', icon: '🔔' },
    { key: 'darkMode', label: 'Dark Mode', icon: '🌙' },
    { key: 'locationServices', label: 'Location Services', icon: '📍' },
    { key: 'autoUpdate', label: 'Auto Update', icon: '⬆️' },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {settingItems.map(({ key, label, icon }, index) => (
          <div
            key={key}
            className={`flex items-center justify-between p-4 ${
              index !== settingItems.length - 1
                ? 'border-b border-gray-100 dark:border-gray-700'
                : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-900 dark:text-white font-medium">{label}</span>
            </div>
            <button
              onClick={() => toggleSetting(key)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settings[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings[key] ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Version: 1.0.0</p>
          <p>Built with React + Vite + Firebase</p>
        </div>
      </div>

      <button className="w-full py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        Clear Cache
      </button>
    </div>
  )
}

export default Settings
