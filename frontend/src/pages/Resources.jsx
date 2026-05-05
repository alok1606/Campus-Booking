import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resourcesAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

// Must match backend enum exactly: 'hall','lab','classroom','equipment','auditorium','ground'
const TYPES = ['', 'hall', 'lab', 'classroom', 'equipment', 'auditorium', 'ground'];

export default function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'hall', description: '', capacity: '', location: '', amenities: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await resourcesAPI.list(params);
      setResources(res.data.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const openForm = (r = null) => {
    setEditItem(r);
    setError('');
    setForm(r
      ? { name: r.name, type: r.type, description: r.description || '', capacity: r.capacity || '', location: r.location || '', amenities: r.amenities?.join(', ') || '' }
      : { name: '', type: 'hall', description: '', capacity: '', location: '', amenities: '' }
    );
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean)
    };
    try {
      if (editItem) await resourcesAPI.update(editItem._id, payload);
      else await resourcesAPI.create(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resourcesAPI.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleAvailable = async (r) => {
    try {
      await resourcesAPI.update(r._id, { isAvailable: !r.isAvailable });
      load();
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Resources</h2>
          <p className="text-ink-500 text-sm">{resources.length} resources</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => openForm()} className="btn-primary">+ Add Resource</button>
        )}
      </div>

      <div className="card p-4 flex gap-3 flex-wrap">
        <input
          className="input flex-1 min-w-[160px]"
          placeholder="Search resources..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="input w-44" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          {TYPES.map(t => <option key={t} value={t}>{t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All Types'}</option>)}
        </select>
        {(filters.search || filters.type) && (
          <button onClick={() => setFilters({ type: '', search: '' })} className="btn-secondary text-xs">Clear</button>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-semibold mb-4">{editItem ? 'Edit Resource' : 'Add Resource'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Seminar Hall 101" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type *</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {TYPES.slice(1).map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Capacity *</label>
                  <input className="input" type="number" min="1" required value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 80" />
                </div>
              </div>
              <div>
                <label className="label">Location *</label>
                <input className="input" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Block B, 1st Floor" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input h-20 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
              </div>
              <div>
                <label className="label">Amenities <span className="text-ink-400 normal-case font-normal">(comma separated)</span></label>
                <input className="input" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="AC, Projector, WiFi, Whiteboard" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Resource'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => (
            <div key={r._id} className="card hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={r.type} />
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${r.isAvailable ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-700'}`}>
                      {r.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <h3 className="font-semibold mt-2 text-ink-900">{r.name}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">📍 {r.location}</p>
                </div>
              </div>

              {r.description && <p className="text-sm text-ink-500 mt-2 line-clamp-2">{r.description}</p>}

              <div className="mt-3 flex flex-wrap gap-1">
                {r.capacity > 0 && <span className="badge bg-ink-100 text-ink-600">👥 {r.capacity} capacity</span>}
                {r.amenities?.slice(0, 3).map(a => <span key={a} className="badge bg-ink-100 text-ink-600">{a}</span>)}
                {r.amenities?.length > 3 && <span className="badge bg-ink-100 text-ink-500">+{r.amenities.length - 3} more</span>}
              </div>

              <div className="mt-4 flex gap-2 flex-wrap mt-auto pt-3 border-t border-ink-100">
                {r.isAvailable ? (
                  <Link to={`/bookings/new?resource=${r._id}`} className="btn-primary text-xs flex-1 text-center">Book Now</Link>
                ) : (
                  <span className="flex-1 text-center text-xs text-ink-400 py-2">Not available for booking</span>
                )}
                {user?.role === 'admin' && (
                  <>
                    <button onClick={() => toggleAvailable(r)} className="btn-secondary text-xs" title={r.isAvailable ? 'Mark unavailable' : 'Mark available'}>
                      {r.isAvailable ? '🔒' : '🔓'}
                    </button>
                    <button onClick={() => openForm(r)} className="btn-secondary text-xs">Edit</button>
                    <button onClick={() => handleDelete(r._id)} className="btn-danger text-xs">Del</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="col-span-3 card text-center py-12 text-ink-400">
              No resources found.
              {user?.role === 'admin' && (
                <button onClick={() => openForm()} className="block mx-auto mt-3 text-ink-700 hover:underline text-sm">+ Add the first resource →</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
