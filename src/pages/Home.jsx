import { useState, useEffect } from 'react'

function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your mobile app is ready</p>
      </header>

      <div className="grid gap-4">
        <Card
          title="Firebase Ready"
          description="Configure your Firebase credentials in src/config/firebase.js"
          icon="🔥"
        />
        <Card
          title="React Router"
          description="Navigation is set up with protected routes support"
          icon="🧭"
        />
        <Card
          title="Tailwind CSS"
          description="Responsive mobile-first styling configured"
          icon="🎨"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Next Steps:</strong> Update the Firebase config with your project credentials and start building your features.
        </p>
      </div>
    </div>
  )
}

function Card({ title, description, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default Home
