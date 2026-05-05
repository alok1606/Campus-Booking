import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsAPI } from '../api/services';

const CATEGORIES = ['academic', 'cultural', 'sports', 'technical', 'workshop', 'seminar', 'other'];

const toDatetimeLocal = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'academic', startDate: '', endDate: '', venue: '', maxAttendees: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      eventsAPI.get(id).then(res => {
        const ev = res.data.event;
        setForm({ title: ev.title, description: ev.description, category: ev.category, startDate: toDatetimeLocal(ev.startDate), endDate: toDatetimeLocal(ev.endDate), venue: ev.venue || '', maxAttendees: ev.maxAttendees || '' });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() };
      if (id) await eventsAPI.update(id, payload);
      else await eventsAPI.create(payload);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-semibold mb-6">{id ? 'Edit Event' : 'Create New Event'}</h2>
      <div className="card">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Event Title</label>
            <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-24 resize-none" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the event..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Venue</label>
              <input className="input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Location" />
            </div>
            <div>
              <label className="label">Start Date & Time</label>
              <input className="input" type="datetime-local" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date & Time</label>
              <input className="input" type="datetime-local" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Max Attendees</label>
              <input className="input" type="number" min="0" value={form.maxAttendees} onChange={e => setForm({ ...form, maxAttendees: e.target.value })} placeholder="0 = unlimited" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : id ? 'Update Event' : 'Create Event'}</button>
            <button type="button" onClick={() => navigate('/events')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
