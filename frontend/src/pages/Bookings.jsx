import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

const STATUSES = ['', 'pending', 'approved', 'rejected', 'cancelled'];

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });

  const load = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const res = await bookingsAPI.list(params);
    setBookings(res.data.bookings || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    await bookingsAPI.cancel(id);
    load();
  };

  const handleExport = async () => {
    const res = await bookingsAPI.export();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = 'bookings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Bookings</h2>
          <p className="text-ink-500 text-sm">{bookings.length} bookings found</p>
        </div>
        <div className="flex gap-2">
          {['admin', 'faculty'].includes(user?.role) && (
            <button onClick={handleExport} className="btn-secondary">⬇ Export CSV</button>
          )}
          <Link to="/bookings/new" className="btn-primary">+ New Booking</Link>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-36" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="label mb-0 whitespace-nowrap">From</label>
          <input className="input" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <label className="label mb-0">To</label>
          <input className="input" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
        </div>
        {(filters.status || filters.startDate || filters.endDate) && (
          <button onClick={() => setFilters({ status: '', startDate: '', endDate: '' })} className="btn-secondary text-xs">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {bookings.map(bk => (
            <div key={bk._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink-900">{bk.title || bk.purpose}</h3>
                    <StatusBadge status={bk.status} />
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{bk.purpose}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-ink-500">
                    <span>
                      <span className="font-medium">Resource: </span>
                      {bk.resource?.name}
                      {bk.resource?.type && <span className="ml-1"><StatusBadge status={bk.resource.type} /></span>}
                    </span>
                    <span>📅 {new Date(bk.startTime).toLocaleString()} → {new Date(bk.endTime).toLocaleString()}</span>
                    {bk.event && <span>🎫 {bk.event?.title}</span>}
                    <span>👥 {bk.attendees} attendees</span>
                  </div>
                  {/* backend populates requestedBy */}
                  {['admin', 'faculty'].includes(user?.role) && bk.requestedBy && (
                    <p className="text-xs text-ink-400 mt-1">Booked by: {bk.requestedBy?.name} ({bk.requestedBy?.email})</p>
                  )}
                  {bk.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">Reason: {bk.rejectionReason}</p>
                  )}
                  {bk.approvedBy && bk.status === 'approved' && (
                    <p className="text-xs text-sage-700 mt-1">Approved by: {bk.approvedBy?.name}</p>
                  )}
                </div>
                {bk.status === 'pending' && (bk.requestedBy?._id === user?._id || user?.role === 'admin') && (
                  <button onClick={() => handleCancel(bk._id)} className="btn-secondary text-xs flex-shrink-0">Cancel</button>
                )}
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="card text-center py-12 text-ink-400">
              No bookings found. <Link to="/bookings/new" className="text-ink-700 hover:underline">Make a booking →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
