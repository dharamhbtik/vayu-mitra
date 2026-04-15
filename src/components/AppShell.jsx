import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <TopNav 
        onMenuClick={toggleSidebar} 
        isSidebarOpen={sidebarOpen} 
      />

      {/* Main Layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar} 
        />

        {/* Content Area */}
        <main 
          className={`
            flex-1 min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8
            transition-all duration-300
            ${isMobile ? 'pb-20' : ''}
            ${sidebarOpen && !isMobile ? 'lg:ml-0' : 'lg:ml-0'}
          `}
        >
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default AppShell;
