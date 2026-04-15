import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import MobileBottomNav from './MobileBottomNav';

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <TopNav />

      {/* Content Area - Full Width */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default AppShell;
