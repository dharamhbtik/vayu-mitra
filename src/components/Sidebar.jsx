import { NavLink } from 'react-router-dom';
import { 
  Map, 
  TrendingUp, 
  LayoutDashboard, 
  Settings, 
  Users, 
  BarChart3,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Map, label: 'AQI Map', exact: true },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: Users, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const bottomItems = [
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

function Sidebar({ isOpen, onToggle }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        <nav className="flex flex-col h-full py-4 px-3">
          {/* Main Navigation */}
          <div className="flex-1 space-y-1">
            {navItems.map(({ to, icon: Icon, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isOpen ? '' : 'lg:mx-auto'}`} />
                <span className={`font-medium text-sm whitespace-nowrap ${isOpen ? 'opacity-100' : 'lg:hidden opacity-0 w-0'} transition-all`}>
                  {label}
                </span>
                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
            {bottomItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isOpen ? '' : 'lg:mx-auto'}`} />
                <span className={`font-medium text-sm ${isOpen ? 'opacity-100' : 'lg:hidden opacity-0 w-0'} transition-all`}>
                  {label}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
