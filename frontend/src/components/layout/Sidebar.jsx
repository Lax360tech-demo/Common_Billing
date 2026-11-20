import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Building2,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, business, categoryConfig, logout } = useAuth();
  const { settings } = useApp();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS / New Bill', href: '/pos', icon: ShoppingCart, highlight: true },
    { name: 'All Invoices', href: '/invoices', icon: Receipt },
    { name: 'Products & Stock', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Suppliers', href: '/suppliers', icon: Building2 },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    setIsMobileOpen?.(false);
    if (window.confirm('Are you sure you want to log out of Lax360 Billing?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r transition-all duration-300 ease-in-out w-72 max-w-[85vw] ${
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      style={{
        backgroundColor: 'var(--theme-bg-sidebar)',
        borderColor: 'var(--theme-sidebar-border)',
        color: 'var(--theme-sidebar-text)'
      }}
    >
      {/* Brand Header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b px-4 justify-between lg:${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
        style={{ borderColor: 'var(--theme-sidebar-border)' }}
      >
        <div className={`flex min-w-0 items-center gap-3 overflow-hidden ${isCollapsed ? 'lg:hidden' : 'flex'}`}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent, #6366f1))'
            }}
          >
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>

          <div className="min-w-0 truncate">
            <h1 className="truncate text-base font-extrabold tracking-tight text-white">
              LAX<span className="text-amber-400">360</span> BILLING
            </h1>
            <p className="flex items-center gap-1 truncate text-[11px] opacity-80 text-slate-300">
              <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
              {business?.category_name || categoryConfig?.name || 'Universal POS SaaS'}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen?.(false)}
          className="lg:hidden shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Collapse / Expand Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed?.(!isCollapsed)}
          className="hidden lg:flex shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-white/10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Business Store Pill */}
     

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setIsMobileOpen?.(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-inner font-extrabold'
                  : 'hover:bg-white/10 hover:text-white text-slate-300 opacity-90 hover:opacity-100'
              } ${item.highlight ? 'ring-1 ring-amber-400/50 bg-amber-500/10 text-amber-300' : ''}`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    backgroundColor: 'var(--theme-primary)',
                    color: '#ffffff'
                  }
                : {}
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Card & Logout */}
      <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--theme-sidebar-border)' }}>
        <div className="flex items-center justify-between gap-2 rounded-xl p-2 bg-white/5 border border-white/5">
          <div className={`flex min-w-0 items-center gap-2.5 ${isCollapsed ? 'lg:hidden' : 'flex'}`}>
            <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] uppercase font-semibold text-amber-400/90 tracking-wider">
                {user?.role || 'Admin'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-600/30 transition cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
