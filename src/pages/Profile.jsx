import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Calendar, Shield, LogOut, Edit2, Check, X } from 'lucide-react';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // User display info
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'No email';
  const userInitial = displayName[0]?.toUpperCase() || 'U';
  const photoURL = user?.photoURL;
  const provider = user?.providerData?.[0]?.providerId || 'email';
  const isGoogleUser = provider.includes('google');

  const handleLogout = async () => {
    setLoading(true);
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
    setLoading(false);
  };

  // Format account creation date
  const memberSince = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    : 'Unknown';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account</p>
      </header>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative">
            {photoURL ? (
              <img 
                src={photoURL} 
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-white dark:border-gray-700 shadow-lg">
                {userInitial}
              </div>
            )}
            {isGoogleUser && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            )}
          </div>

          {/* User Info */}
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
          <p className="text-gray-500 dark:text-gray-400">{email}</p>
          
          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isEditing ? (
              <><Check className="w-4 h-4" /> Save Profile</>
            ) : (
              <><Edit2 className="w-4 h-4" /> Edit Profile</>
            )}
          </button>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Account Information</h3>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{email}</p>
            </div>
            {user?.emailVerified ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium rounded-full">
                Verified
              </span>
            ) : (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs font-medium rounded-full">
                Unverified
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sign-in Method</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {isGoogleUser ? 'Google Account' : 'Email & Password'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="font-medium text-gray-900 dark:text-white">{memberSince}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">UID</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
              <p className="font-medium text-gray-900 dark:text-white font-mono text-xs">
                {user?.uid?.substring(0, 16)}...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button 
        onClick={handleLogout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <LogOut className="w-5 h-5" />
            Sign Out
          </>
        )}
      </button>
    </div>
  );
}

export default Profile;
