import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSchema } from '@/context/SchemaContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users, Settings,
  Menu, X, Sun, Moon, LogOut, ChevronDown,
} from 'lucide-react';

const iconMap = {
  Package, ShoppingCart, FileText, Users, Settings, LayoutDashboard,
};

function getIcon(name) {
  return iconMap[name] || Package;
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { schema } = useSchema();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const entities = schema?.entities || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6 shrink-0">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">dash-drop</span>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <Link
            to="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>

          {entities.map(entity => {
            const Icon = getIcon(entity.icon);
            const path = `/${entity.name.toLowerCase()}s`;
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={entity.name}
                to={path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {entity.displayName || `${entity.name}s`}
              </Link>
            );
          })}

          {/* Admin-only Users link */}
          {user?.role === 'Admin' && (
            <Link
              to="/users"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === '/users'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
          )}
        </nav>

        <div className="border-t p-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* App name — visible on mobile/tablet only */}
          <div className="flex items-center gap-2 lg:hidden">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">dash-drop</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggle}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" title="Log out" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
