import React, { useEffect, useState } from 'react';
import { bookingsAPI, eventsAPI } from '../api/services';
import StatusBadge from '../components/common/StatusBadge';

const ReasonModal = ({ onConfirm, onClose, action }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-xl">
        <h3 className="font-display text-lg font-semibold mb-3">
          {action === 'approve' ? 'Approve' : 'Reject'} — Add Reason
        </h3>
        <textarea
          className="input h-24 resize-none"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={action === 'approve' ? 'Optional approval note...' : 'Reason for rejection (required)...'}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onConfirm(reason)}
            disabled={action === 'reject' && !reason.trim()}
            className={action === 'approve' ? 'btn-success' : 'btn-danger'}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default function Approvals() {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bookings');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [b, e] = await Promise.all([
        bookingsAPI.list({ status: 'pending' }),
        eventsAPI.list({ status: 'submitted' })
      ]);
      setBookings(b.data.bookings || []);
      setEvents(e.data.events || []);
    } catch (err) {
      setError('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleBookingAction = async (id, action, reason) => {
    try {
      if (action === 'approve') {
        await bookingsAPI.approve(id);
      } else {
        if (!reason.trim()) return;
        await bookingsAPI.reject(id, { rejectionReason: reason });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      setModal(null);
    }
  };

  const handleEventAction = async (id, action, reason) => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      await eventsAPI.review(id, { status, rejectionReason: reason });
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      setModal(null);
    }
  };

  const pendingCount = (tab === 'bookings' ? bookings : events).length;

  return (
    <div className="space-y-5">
      {modal && (
        <ReasonModal
          action={modal.action}
          onConfirm={(reason) =>
            modal.type === 'booking'
              ? handleBookingAction(modal.id, modal.action, reason)
              : handleEventAction(modal.id, modal.action, reason)
          }
          onClose={() => setModal(null)}
        />
      )}

      <div>
        <h2 className="font-display text-2xl font-semibold">Approvals</h2>
        <p className="text-ink-500 text-sm">{bookings.length + events.length} items pending review</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="flex gap-1 border-b border-ink-200">
        {[['bookings', `Bookings (${bookings.length})`], ['events', `Events (${events.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'text-ink-900 border-b-2 border-ink-900 -mb-px' : 'text-ink-400 hover:text-ink-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {tab === 'bookings' && bookings.map(bk => (
            <div key={bk._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{bk.title || bk.purpose}</h3>
                    <StatusBadge status={bk.status} />
                  </div>
                  <div className="text-xs text-ink-500 mt-1 space-y-0.5">
                    <p>Purpose: <span className="font-medium">{bk.purpose}</span></p>
                    <p>Resource: <span className="font-medium">{bk.resource?.name}</span> ({bk.resource?.type})</p>
                    <p>Requested by: <span className="font-medium">{bk.requestedBy?.name}</span> — {bk.requestedBy?.email}</p>
                    <p>Time: {new Date(bk.startTime).toLocaleString()} → {new Date(bk.endTime).toLocaleString()}</p>
                    <p>Attendees: {bk.attendees}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setModal({ type: 'booking', id: bk._id, action: 'approve' })} className="btn-success text-xs">Approve</button>
                  <button onClick={() => setModal({ type: 'booking', id: bk._id, action: 'reject' })} className="btn-danger text-xs">Reject</button>
                </div>
              </div>
            </div>
          ))}

          {tab === 'events' && events.map(ev => (
            <div key={ev._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{ev.title}</h3>
                    <StatusBadge status={ev.status} />
                    <StatusBadge status={ev.category} />
                  </div>
                  <p className="text-xs text-ink-500 mt-1 line-clamp-2">{ev.description}</p>
                  <div className="text-xs text-ink-400 mt-1 space-y-0.5">
                    <p>Organizer: <span className="font-medium">{ev.organizer?.name}</span> — {ev.organizer?.email}</p>
                    <p>Dates: {new Date(ev.startDate).toLocaleDateString()} — {new Date(ev.endDate).toLocaleDateString()}</p>
                    {ev.venue && <p>Venue: {ev.venue}</p>}
                    {ev.expectedAttendees > 0 && <p>Expected: {ev.expectedAttendees} attendees</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setModal({ type: 'event', id: ev._id, action: 'approve' })} className="btn-success text-xs">Approve</button>
                  <button onClick={() => setModal({ type: 'event', id: ev._id, action: 'reject' })} className="btn-danger text-xs">Reject</button>
                </div>
              </div>
            </div>
          ))}

          {pendingCount === 0 && (
            <div className="card text-center py-12">
              <p className="text-ink-400">✓ No pending {tab} to review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
