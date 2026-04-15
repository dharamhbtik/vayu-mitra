import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import AQIMap from './components/AQIMap'
import AQITrends from './components/AQITrends'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes - No layout wrapper */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes with AppShell layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route index element={<AQIMap />} />
            <Route path="map" element={<AQIMap />} />
            <Route path="trends" element={<AQITrends />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="documents" element={<Documents />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* 404 and redirect */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
