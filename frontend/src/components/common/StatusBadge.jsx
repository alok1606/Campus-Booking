import React from 'react';

const STATUS_STYLES = {
  // Booking/Event statuses
  draft:        'bg-ink-100 text-ink-600',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved:     'bg-sage-100 text-sage-700',
  rejected:     'bg-red-100 text-red-700',
  completed:    'bg-purple-100 text-purple-700',
  pending:      'bg-amber-100 text-amber-700',
  cancelled:    'bg-ink-100 text-ink-500',
  // Event categories
  academic:     'bg-blue-100 text-blue-700',
  cultural:     'bg-pink-100 text-pink-700',
  sports:       'bg-green-100 text-green-700',
  technical:    'bg-cyan-100 text-cyan-700',
  seminar:      'bg-purple-100 text-purple-700',
  workshop:     'bg-orange-100 text-orange-700',
  other:        'bg-ink-100 text-ink-600',
  // Resource types
  hall:         'bg-amber-100 text-amber-700',
  lab:          'bg-blue-100 text-blue-700',
  classroom:    'bg-sage-100 text-sage-700',
  equipment:    'bg-purple-100 text-purple-700',
  auditorium:   'bg-rose-100 text-rose-700',
  ground:       'bg-green-100 text-green-700',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-ink-100 text-ink-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
