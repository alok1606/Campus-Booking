import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api/services';

const ACTION_COLORS = {
  BOOKING_CREATED: 'bg-blue-100 text-blue-700',
  BOOKING_APPROVED: 'bg-sage-100 text-sage-700',
  BOOKING_REJECTED: 'bg-red-100 text-red-700',
  BOOKING_CANCELLED: 'bg-ink-100 text-ink-600',
  EVENT_CREATED: 'bg-blue-100 text-blue-700',
  EVENT_APPROVED: 'bg-sage-100 text-sage-700',
  EVENT_REJECTED: 'bg-red-100 text-red-700',
  EVENT_SUBMITTED: 'bg-amber-100 text-amber-700',
  EVENT_UPDATED: 'bg-purple-100 text-purple-700',
  EVENT_DELETED: 'bg-red-100 text-red-700',
  RESOURCE_CREATED: 'bg-blue-100 text-blue-700',
  RESOURCE_UPDATED: 'bg-purple-100 text-purple-700',
  RESOURCE_DELETED: 'bg-red-100 text-red-700',
  USER_REGISTERED: 'bg-sage-100 text-sage-700',
  USER_LOGIN: 'bg-ink-100 text-ink-600',
};

const ACTIONS = [
  '', 'BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED',
  'EVENT_CREATED', 'EVENT_SUBMITTED', 'EVENT_APPROVED', 'EVENT_REJECTED',
  'RESOURCE_CREATED', 'RESOURCE_UPDATED', 'RESOURCE_DELETED',
  'USER_REGISTERED', 'USER_LOGIN'
];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...(action && { action }) };
      const res = await adminAPI.auditLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, action]);

  const totalPages = Math.ceil(total / limit);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Audit Log</h2>
        <p className="text-ink-500 text-sm">{total} total entries</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Filter by Action</label>
          <select className="input w-56" value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a || 'All Actions'}</option>
            ))}
          </select>
        </div>
        {action && (
          <button onClick={() => { setAction(''); setPage(1); }} className="btn-secondary text-xs self-end">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-100 text-ink-600">
                <tr>
                  {['Action', 'Performed By', 'Target', 'Details', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`badge font-mono text-xs ${ACTION_COLORS[log.action] || 'bg-ink-100 text-ink-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{log.performedBy?.name || 'System'}</p>
                      <p className="text-xs text-ink-400">{log.performedBy?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {log.targetModel && (
                        <span className="badge bg-ink-100 text-ink-600">{log.targetModel}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500 max-w-xs">
                      {log.details ? (
                        <span className="font-mono">{JSON.stringify(log.details).slice(0, 80)}</span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-400 font-mono whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-12 text-ink-400">No audit logs found</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-500">
                Page {page} of {totalPages} · {total} entries
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
