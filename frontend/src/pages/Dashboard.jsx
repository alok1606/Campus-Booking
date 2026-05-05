import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, bookingsAPI, resourcesAPI, adminAPI } from '../api/services';
import StatusBadge from '../components/common/StatusBadge';

const StatCard = ({ label, value, sub, color = 'ink' }) => (
  <div className="card">
    <p className="text-xs text-ink-500 uppercase tracking-wide font-medium">{label}</p>
    <p className={`text-3xl font-display font-bold mt-1 text-${color}-800`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [e, b, r] = await Promise.all([
          eventsAPI.list(),
          bookingsAPI.list(),
          resourcesAPI.list()
        ]);
        setEvents(e.data.events || []);
        setBookings(b.data.bookings || []);
        setResources(r.data.resources || []);

        if (user?.role === 'admin') {
          const s = await adminAPI.stats();
          setAdminStats(s.data.stats);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>;

  const isStaff = ['admin', 'faculty'].includes(user?.role);
  const pending = bookings.filter(b => b.status === 'pending').length;
  const pendingEvents = events.filter(e => e.status === 'submitted').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Good day, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-ink-500 text-sm mt-1">Here's an overview of your campus activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {user?.role === 'admin' && adminStats ? (
          <>
            <StatCard label="Total Users" value={adminStats.users} />
            <StatCard label="Total Bookings" value={adminStats.bookings} />
            <StatCard label="Pending Approvals" value={adminStats.pendingBookings + adminStats.pendingEvents} color="amber" sub="Need your review" />
            <StatCard label="Resources" value={adminStats.resources} sub={`${resources.filter(r => r.isAvailable).length} available`} />
          </>
        ) : (
          <>
            <StatCard label="My Events" value={events.length} />
            <StatCard label="My Bookings" value={bookings.length} />
            {isStaff && <StatCard label="Pending Approvals" value={pending + pendingEvents} color="amber" sub="Need your review" />}
            <StatCard label="Resources" value={resources.length} sub={`${resources.filter(r => r.isAvailable).length} available`} />
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Recent Events</h3>
            <Link to="/events" className="text-xs text-ink-500 hover:text-ink-900 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {events.slice(0, 5).map(ev => (
              <div key={ev._id} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-ink-400">{new Date(ev.startDate).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={ev.status} />
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">No events yet</p>}
          </div>
          <Link to="/events/new" className="btn-primary mt-4 block text-center w-full">+ Create Event</Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Recent Bookings</h3>
            <Link to="/bookings" className="text-xs text-ink-500 hover:text-ink-900 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {bookings.slice(0, 5).map(bk => (
              <div key={bk._id} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">{bk.title || bk.purpose}</p>
                  <p className="text-xs text-ink-400">{bk.resource?.name} · {new Date(bk.startTime).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={bk.status} />
              </div>
            ))}
            {bookings.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">No bookings yet</p>}
          </div>
          <Link to="/bookings/new" className="btn-primary mt-4 block text-center w-full">+ New Booking</Link>
        </div>
      </div>

      {isStaff && (pending + pendingEvents) > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-900">🔔 {pending + pendingEvents} item{(pending + pendingEvents) !== 1 ? 's' : ''} pending your review</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {pending > 0 && `${pending} booking request${pending !== 1 ? 's' : ''}`}
                {pending > 0 && pendingEvents > 0 && ' · '}
                {pendingEvents > 0 && `${pendingEvents} event submission${pendingEvents !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link to="/approvals" className="btn-primary text-sm">Review Now →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
