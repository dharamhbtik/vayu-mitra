import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, FileText, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dash' },
  { to: '/documents', icon: FileText, label: 'Docs' },
  { to: '/settings', icon: Settings, label: 'More' },
];

function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors
              ${isActive 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            end={to === '/'}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-0.5">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
