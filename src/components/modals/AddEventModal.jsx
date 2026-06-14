import { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import { toDateKey, MONTH_NAMES } from '../../utils/dateUtils';
import { createCalendarEvent } from '../../utils/googleApi';

const EVENT_COLORS = [
  { label: 'Blue', value: '#3A86FF' },
  { label: 'Green', value: '#0B8043' },
  { label: 'Red', value: '#D50000' },
  { label: 'Pink', value: '#F06292' },
  { label: 'Purple', value: '#AB47BC' },
  { label: 'Orange', value: '#F4511E' },
  { label: 'Yellow', value: '#F6BF26' },
];

export default function AddEventModal({ date, onClose, onSaved }) {
  const { addContact, refreshGoogleEvents } = useCalendar();
  const { accessToken } = useAuth();

  const [tab, setTab] = useState('event'); // 'event' | 'contact'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(toDateKey(date));
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [eventColor, setEventColor] = useState('#3A86FF');
  const [eventPhone, setEventPhone] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bdMonth, setBdMonth] = useState(String(date.getMonth() + 1));
  const [bdDay, setBdDay] = useState('');
  const [hasAnniversary, setHasAnniversary] = useState(false);
  const [annMonth, setAnnMonth] = useState('1');
  const [annDay, setAnnDay] = useState('');
  const [contactPhoto, setContactPhoto] = useState('');

  const dayLabel = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  async function handleSaveEvent(e) {
    e.preventDefault();
    if (!eventTitle.trim()) { setError('Please enter a title.'); return; }
    setError('');
    setSubmitting(true);

    try {
      if (accessToken) {
        const body = {
          summary: eventTitle.trim(),
          description: eventNotes,
          colorId: Object.keys({ '1': '#7986CB','2': '#33B679','3': '#8E24AA','4': '#E67C73','5': '#F6BF26','6': '#F4511E','7': '#039BE5','8': '#616161','9': '#3F51B5','10': '#0B8043','11': '#D50000' })
            .find(k => eventColor === ['#7986CB','#33B679','#8E24AA','#E67C73','#F6BF26','#F4511E','#039BE5','#616161','#3F51B5','#0B8043','#D50000'][k - 1]) || undefined,
        };
        if (allDay) {
          body.start = { date: eventDate };
          body.end = { date: eventDate };
        } else {
          const startDT = `${eventDate}T${eventTime || '09:00'}:00`;
          const endDT = `${eventDate}T${eventEndTime || eventTime || '10:00'}:00`;
          body.start = { dateTime: startDT };
          body.end = { dateTime: endDT };
        }
        await createCalendarEvent(accessToken, body);
        refreshGoogleEvents();
      } else {
        // Save locally as a contact event if no Google auth
        alert('Connect Google Calendar to save events, or add the person as a birthday/anniversary contact.');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setContactPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSaveContact(e) {
    e.preventDefault();
    if (!contactName.trim()) { setError('Please enter a name.'); return; }
    if (!bdDay) { setError('Please enter a birthday day.'); return; }
    setError('');

    const contact = {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      photo: contactPhoto || null,
      birthday: { month: parseInt(bdMonth), day: parseInt(bdDay) },
      anniversary: hasAnniversary && annDay
        ? { month: parseInt(annMonth), day: parseInt(annDay) }
        : null,
    };
    addContact(contact);
    onSaved?.();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--add">
        <div className="modal__header">
          <h2 className="modal__title">Add for {dayLabel}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__tabs">
          <button
            className={`tab ${tab === 'event' ? 'tab--active' : ''}`}
            onClick={() => setTab('event')}
          >Calendar Event</button>
          <button
            className={`tab ${tab === 'contact' ? 'tab--active' : ''}`}
            onClick={() => setTab('contact')}
          >Birthday / Anniversary</button>
        </div>

        {error && <div className="modal__error">{error}</div>}

        {tab === 'event' && (
          <form className="modal__body" onSubmit={handleSaveEvent}>
            <div className="form-row">
              <label className="form-label">Title *</label>
              <input className="form-input" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title" required />
            </div>

            <div className="form-row">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>

            <div className="form-row form-row--inline">
              <label className="form-check">
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
                All day
              </label>
            </div>

            {!allDay && (
              <div className="form-row form-row--inline">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Start time</label>
                  <input className="form-input" type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">End time</label>
                  <input className="form-input" type="time" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-row">
              <label className="form-label">Phone number (for WhatsApp / Call)</label>
              <input className="form-input" type="tel" value={eventPhone} onChange={e => setEventPhone(e.target.value)} placeholder="+27 83 123 4567" />
            </div>

            <div className="form-row">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {EVENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    className={`color-swatch ${eventColor === c.value ? 'color-swatch--selected' : ''}`}
                    style={{ background: c.value }}
                    title={c.label}
                    onClick={() => setEventColor(c.value)}
                  />
                ))}
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={eventNotes} onChange={e => setEventNotes(e.target.value)} placeholder="Optional notes…" />
            </div>

            <div className="modal__footer">
              <button className="btn btn--primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Event'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}

        {tab === 'contact' && (
          <form className="modal__body" onSubmit={handleSaveContact}>
            <div className="form-row">
              <label className="form-label">Name *</label>
              <input className="form-input" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full name" required />
            </div>

            <div className="form-row">
              <label className="form-label">Phone (for WhatsApp / Call)</label>
              <input className="form-input" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+27 83 123 4567" />
            </div>

            <div className="form-row form-row--inline">
              <div style={{ flex: 1 }}>
                <label className="form-label">Birthday Month *</label>
                <select className="form-input" value={bdMonth} onChange={e => setBdMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{MONTH_NAMES[i]}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Day *</label>
                <input className="form-input" type="number" min={1} max={31} value={bdDay} onChange={e => setBdDay(e.target.value)} placeholder="Day" required />
              </div>
            </div>

            <div className="form-row form-row--inline">
              <label className="form-check">
                <input type="checkbox" checked={hasAnniversary} onChange={e => setHasAnniversary(e.target.checked)} />
                Add Anniversary date
              </label>
            </div>

            {hasAnniversary && (
              <div className="form-row form-row--inline">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Anniversary Month</label>
                  <select className="form-input" value={annMonth} onChange={e => setAnnMonth(e.target.value)}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{MONTH_NAMES[i]}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Day</label>
                  <input className="form-input" type="number" min={1} max={31} value={annDay} onChange={e => setAnnDay(e.target.value)} placeholder="Day" />
                </div>
              </div>
            )}

            <div className="form-row">
              <label className="form-label">Photo</label>
              <div className="photo-upload">
                {contactPhoto && (
                  <img src={contactPhoto} alt="Preview" className="photo-preview" />
                )}
                <label className="btn btn--sm btn--ghost btn--upload">
                  Upload photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
                {contactPhoto && (
                  <button type="button" className="btn btn--sm btn--ghost" onClick={() => setContactPhoto('')}>Remove</button>
                )}
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn--primary" type="submit">Save Person</button>
              <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
