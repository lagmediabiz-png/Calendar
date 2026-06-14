import { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import { toDateKey, MONTH_NAMES, formatEventTime } from '../../utils/dateUtils';
import { deleteCalendarEvent } from '../../utils/googleApi';

function whatsappLink(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}`;
}

function callLink(phone) {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export default function DayModal({ onAddEvent }) {
  const { selectedDay, setSelectedDay, notes, saveNote, getEventsForDate, refreshGoogleEvents, deleteContact } = useCalendar();
  const { accessToken } = useAuth();

  if (!selectedDay) return null;

  function onClose() { setSelectedDay(null); }

  const { date } = selectedDay;
  const key = toDateKey(date);
  const events = getEventsForDate(date);
  const note = notes[key] || '';

  function handleNoteChange(e) {
    saveNote(key, e.target.value);
  }

  async function handleDeleteGoogleEvent(eventId) {
    if (!accessToken) return;
    if (!confirm('Delete this event from Google Calendar?')) return;
    try {
      await deleteCalendarEvent(accessToken, eventId);
      refreshGoogleEvents();
    } catch (e) {
      alert('Could not delete event: ' + e.message);
    }
  }

  const dayLabel = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{dayLabel}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          {/* Events list */}
          {events.length === 0 && (
            <p className="modal__empty">No events today.</p>
          )}

          {events.map(event => (
            <EventRow
              key={event.id}
              event={event}
              accessToken={accessToken}
              onDeleteGoogle={() => handleDeleteGoogleEvent(event.id)}
              onDeleteContact={() => { if (confirm('Remove this person?')) { deleteContact(event.contact.id); onClose(); } }}
            />
          ))}

          {/* Notes */}
          <div className="modal__section">
            <label className="modal__label">Notes for this day</label>
            <textarea
              className="modal__textarea"
              value={note}
              onChange={handleNoteChange}
              placeholder="Add a note…"
              rows={3}
            />
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--primary" onClick={() => onAddEvent(date)}>+ Add Event</button>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, onDeleteGoogle, onDeleteContact }) {
  const phone = event.contact?.phone;
  const isLocal = event.source === 'local';

  return (
    <div className="event-row" style={{ borderLeftColor: event.color }}>
      <div className="event-row__header">
        <span className="event-row__dot" style={{ background: event.color }} />
        <span className="event-row__title">{event.summary}</span>
        {!event.allDay && (
          <span className="event-row__time">{formatEventTime(event.start)}</span>
        )}
        {event.source === 'google' && (
          <button className="icon-btn icon-btn--danger" onClick={onDeleteGoogle} title="Delete from Google Calendar">🗑</button>
        )}
        {isLocal && (
          <button className="icon-btn icon-btn--danger" onClick={onDeleteContact} title="Remove person">🗑</button>
        )}
      </div>

      {/* Contact actions */}
      {phone && (
        <div className="event-row__actions">
          <a
            href={whatsappLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--sm btn--whatsapp"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a href={callLink(phone)} className="btn btn--sm btn--call">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.1 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .21h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.35a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Call
          </a>
        </div>
      )}
    </div>
  );
}
