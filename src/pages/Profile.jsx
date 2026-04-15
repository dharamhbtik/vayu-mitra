import { useState } from 'react'

function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Mobile app developer',
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      </header>

      <div className="flex flex-col items-center py-6">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl">
          👤
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">About</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={user.bio}
                  onChange={(e) => setUser({ ...user, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">{user.bio}</p>
          )}
        </div>
      </div>

      <button className="w-full py-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
        Sign Out
      </button>
    </div>
  )
}

export default Profile
