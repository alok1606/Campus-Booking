import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Icon = ({ name }) => {
  const icons = {
    dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    events: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    resources: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    bookings: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    approvals: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    notifications: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    reports: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    audit: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
  };
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={icons[name]} /></svg>;
};

const roleBadgeColor = { admin: 'bg-amber-100 text-amber-800', faculty: 'bg-sage-100 text-sage-800', student: 'bg-ink-100 text-ink-700' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
    { to: '/events', label: 'Events', icon: 'events' },
    { to: '/resources', label: 'Resources', icon: 'resources' },
    { to: '/bookings', label: 'Bookings', icon: 'bookings' },
    ...(['admin', 'faculty'].includes(user?.role) ? [{ to: '/approvals', label: 'Approvals', icon: 'approvals' }] : []),
    { to: '/notifications', label: 'Notifications', icon: 'notifications' },
    ...(['admin', 'faculty'].includes(user?.role) ? [{ to: '/reports', label: 'Reports', icon: 'reports' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/audit', label: 'Audit Log', icon: 'audit' }] : [])
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-ink-900 text-white ${mobile ? 'w-72' : 'w-60'}`}>
      <div className="p-5 border-b border-ink-700">
        <h1 className="font-display text-xl font-semibold tracking-tight text-white">CampusBook</h1>
        <p className="text-ink-400 text-xs mt-0.5 font-body">Resource & Event Management</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navLinks.map(link => (
          <NavLink key={link.to} to={link.to} end={link.exact}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-150 ${isActive ? 'bg-white text-ink-900 font-medium shadow-sm' : 'text-ink-300 hover:text-white hover:bg-ink-800'}`}
            onClick={() => mobile && setMobileOpen(false)}>
            <Icon name={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-ink-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-sm font-display font-semibold">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <span className={`badge ${roleBadgeColor[user?.role]}`}>{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-ink-400 hover:text-white hover:bg-ink-800 transition-all">
          <Icon name="logout" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10"><Sidebar mobile /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-ink-200">
          <button onClick={() => setMobileOpen(true)} className="p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <span className="font-display font-semibold">CampusBook</span>
          <div className="w-7 h-7 rounded-full bg-ink-200 flex items-center justify-center text-xs font-semibold">{user?.name?.[0]}</div>
        </header>
        <main className="flex-1 overflow-y-auto bg-ink-50 p-4 md:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
