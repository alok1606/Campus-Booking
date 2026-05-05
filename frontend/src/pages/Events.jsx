import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

const CATEGORIES = ['', 'academic', 'cultural', 'sports', 'technical', 'workshop', 'seminar', 'other'];
const STATUSES   = ['', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed'];

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', status: '', search: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await eventsAPI.list(params);
      setEvents(res.data.events || []);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await eventsAPI.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSubmit = async (id) => {
    if (!confirm('Submit this event for review?')) return;
    try {
      await eventsAPI.submit(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Submit failed');
    }
  };

  const isOwner = (ev) => ev.organizer?._id === user?._id || ev.organizer === user?._id;
  const canEdit = (ev) => (isOwner(ev) || user?.role === 'admin') && ['draft', 'rejected'].includes(ev.status);
  const canSubmit = (ev) => isOwner(ev) && ['draft', 'rejected'].includes(ev.status);
  const canDelete = (ev) => isOwner(ev) || user?.role === 'admin';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Events</h2>
          <p className="text-ink-500 text-sm">{events.length} events found</p>
        </div>
        <Link to="/events/new" className="btn-primary">+ New Event</Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          className="input flex-1 min-w-[160px]"
          placeholder="Search events..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="input w-40" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>)}
        </select>
        <select className="input w-40" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Statuses'}</option>)}
        </select>
        {(filters.search || filters.category || filters.status) && (
          <button onClick={() => setFilters({ category: '', status: '', search: '' })} className="btn-secondary text-xs">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-3">
          {events.map(ev => (
            <div key={ev._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink-900">{ev.title}</h3>
                    <StatusBadge status={ev.status} />
                    <StatusBadge status={ev.category} />
                  </div>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{ev.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-ink-400">
                    <span>📅 {new Date(ev.startDate).toLocaleDateString()} — {new Date(ev.endDate).toLocaleDateString()}</span>
                    {ev.venue && <span>📍 {ev.venue}</span>}
                    {ev.expectedAttendees > 0 && <span>👥 {ev.expectedAttendees} expected</span>}
                    <span>👤 {ev.organizer?.name}</span>
                  </div>
                  {ev.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
                      Rejection reason: {ev.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {canSubmit(ev) && (
                    <button onClick={() => handleSubmit(ev._id)} className="btn-primary text-xs">Submit</button>
                  )}
                  {canEdit(ev) && (
                    <Link to={`/events/${ev._id}/edit`} className="btn-secondary text-xs">Edit</Link>
                  )}
                  {canDelete(ev) && (
                    <button onClick={() => handleDelete(ev._id)} className="btn-danger text-xs">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="card text-center py-12 text-ink-400">
              No events found.{' '}
              <Link to="/events/new" className="text-ink-700 hover:underline">Create one →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
