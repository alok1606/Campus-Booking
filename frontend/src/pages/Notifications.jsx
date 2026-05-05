import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../api/services';

const TYPE_ICON = {
  booking_pending:  '📋',
  booking_approved: '✅',
  booking_rejected: '❌',
  event_approved:   '🎉',
  event_rejected:   '❌',
  event_submitted:  '📤',
  general:          '🔔',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Notifications</h2>
          <p className="text-ink-500 text-sm">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-xs">Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ink-300 border-t-ink-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`card cursor-pointer transition-all hover:shadow-md ${!n.isRead ? 'border-ink-400 bg-ink-50' : 'opacity-70'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.isRead ? 'text-ink-900' : 'text-ink-600'}`}>{n.title}</p>
                    <span className="text-xs text-ink-400 flex-shrink-0 font-mono">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{n.message}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-ink-800 flex-shrink-0 mt-1.5" />}
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="card text-center py-12 text-ink-400">
              <p className="text-2xl mb-2">🔔</p>
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
