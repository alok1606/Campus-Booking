import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingsAPI, resourcesAPI, eventsAPI } from '../api/services';

export default function BookingForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedResource = searchParams.get('resource');

  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    resource: preselectedResource || '',
    title: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: 1,
    event: ''
  });
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resourcesAPI.list().then(r => setResources(r.data.resources || []));
    eventsAPI.list().then(r => setEvents((r.data.events || []).filter(e => e.status === 'approved')));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setConflict(null); setLoading(true);
    try {
      const payload = {
        resource: form.resource,
        title: form.title,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        purpose: form.purpose,
        attendees: Number(form.attendees),
        ...(form.event && { event: form.event })
      };
      await bookingsAPI.create(payload);
      navigate('/bookings');
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Failed to create booking');
      }
    } finally { setLoading(false); }
  };

  const applySuggestedSlot = () => {
    // backend returns suggestion.suggestedStart / suggestedEnd
    const s = conflict?.suggestion;
    if (!s) return;
    const toLocal = (d) => new Date(d).toISOString().slice(0, 16);
    setForm(prev => ({
      ...prev,
      startTime: toLocal(s.suggestedStart),
      endTime: toLocal(s.suggestedEnd)
    }));
    setConflict(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-semibold mb-6">New Booking</h2>
      <div className="card">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

        {conflict && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
            <p className="text-amber-800 font-medium text-sm">⚠️ Time slot conflict detected</p>
            <p className="text-amber-700 text-xs mt-1">
              Already booked: <strong>{conflict.conflict?.existingBooking?.title}</strong>{' '}
              ({new Date(conflict.conflict?.existingBooking?.start).toLocaleString()} →{' '}
              {new Date(conflict.conflict?.existingBooking?.end).toLocaleString()})
            </p>
            {conflict.suggestion && (
              <div className="mt-3">
                <p className="text-xs text-amber-700 font-medium mb-2">Next available slot:</p>
                <div className="bg-white border border-amber-200 rounded p-3 text-xs font-mono text-amber-800">
                  <p>Start: {new Date(conflict.suggestion.suggestedStart).toLocaleString()}</p>
                  <p>End:   {new Date(conflict.suggestion.suggestedEnd).toLocaleString()}</p>
                </div>
                <button onClick={applySuggestedSlot} className="btn-primary text-xs mt-3">Use Suggested Slot</button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Resource</label>
            <select className="input" required value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })}>
              <option value="">Select a resource...</option>
              {resources.map(r => (
                <option key={r._id} value={r._id}>{r.name} ({r.type}) — Capacity: {r.capacity}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Booking Title</label>
            <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Final Year Project Demo" />
          </div>

          <div>
            <label className="label">Purpose / Description</label>
            <input className="input" required value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="What will this resource be used for?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input className="input" type="datetime-local" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input className="input" type="datetime-local" required value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Expected Attendees</label>
            <input className="input" type="number" min="1" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} />
          </div>

          <div>
            <label className="label">Link to Event (optional)</label>
            <select className="input" value={form.event} onChange={e => setForm({ ...form, event: e.target.value })}>
              <option value="">No linked event</option>
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Checking availability...' : 'Request Booking'}
            </button>
            <button type="button" onClick={() => navigate('/bookings')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
