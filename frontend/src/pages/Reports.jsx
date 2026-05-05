import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../api/services';
import StatusBadge from '../components/common/StatusBadge';

export default function Reports() {
  const [data, setData] = useState([]);
  const [type, setType] = useState('bookings');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { type, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await reportsAPI.get(params);
      setData(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type, filters]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { type, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await reportsAPI.exportCSV(params);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Reports</h2>
          <p className="text-ink-500 text-sm">{data.length} records found</p>
        </div>
        <button onClick={handleExport} disabled={exporting || data.length === 0} className="btn-primary">
          {exporting ? 'Exporting...' : '⬇ Export CSV'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Report Type</label>
          <div className="flex gap-2">
            {['bookings', 'events'].map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${type === t ? 'bg-ink-900 text-white' : 'border border-ink-300 text-ink-600 hover:bg-ink-100'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">From</label>
          <input className="input" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
        </div>
        <div>
          <label className="label">To</label>
          <input className="input" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
        </div>
        {(filters.startDate || filters.endDate) && (
          <button onClick={() => setFilters({ startDate: '', endDate: '' })} className="btn-secondary text-xs self-end">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-ink-100 text-ink-600">
              {type === 'bookings' ? (
                <tr>
                  {['Title', 'Purpose', 'Resource', 'Booked By', 'Start', 'End', 'Attendees', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              ) : (
                <tr>
                  {['Title', 'Category', 'Organizer', 'Start Date', 'End Date', 'Venue', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-ink-100">
              {type === 'bookings' && data.map(bk => (
                <tr key={bk._id} className="hover:bg-ink-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{bk.title}</td>
                  <td className="px-4 py-3 text-ink-600 max-w-[150px] truncate">{bk.purpose}</td>
                  <td className="px-4 py-3 text-ink-600">{bk.resource?.name}</td>
                  {/* reportsController normalises requestedBy → bookedBy */}
                  <td className="px-4 py-3 text-ink-600">{bk.bookedBy?.name}</td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs whitespace-nowrap">{new Date(bk.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs whitespace-nowrap">{new Date(bk.endTime).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500">{bk.attendees}</td>
                  <td className="px-4 py-3"><StatusBadge status={bk.status} /></td>
                </tr>
              ))}
              {type === 'events' && data.map(ev => (
                <tr key={ev._id} className="hover:bg-ink-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{ev.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={ev.category} /></td>
                  <td className="px-4 py-3 text-ink-600">{ev.organizer?.name}</td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs whitespace-nowrap">{new Date(ev.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs whitespace-nowrap">{new Date(ev.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-ink-500">{ev.venue || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-12 text-ink-400">No data for selected filters</div>
          )}
        </div>
      )}
    </div>
  );
}
