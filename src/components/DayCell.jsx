import { useCalendar } from '../context/CalendarContext';
import { toDateKey, isToday } from '../utils/dateUtils';

const EVENT_COLORS = {
  birthday: '#F06292',
  anniversary: '#AB47BC',
  google: '#3A86FF',
};

export default function DayCell({ date, isCurrentMonth }) {
  const { getEventsForDate, notes, setSelectedDay } = useCalendar();
  const key = toDateKey(date);
  const events = getEventsForDate(date);
  const note = notes[key] || '';
  const today = isToday(date);

  function openDay() {
    setSelectedDay({ date, events });
  }

  return (
    <div
      className={[
        'day-cell',
        !isCurrentMonth ? 'day-cell--other' : '',
        today ? 'day-cell--today' : '',
      ].filter(Boolean).join(' ')}
      onClick={openDay}
    >
      <div className="day-cell__top">
        <span className={`day-cell__number ${today ? 'day-cell__number--today' : ''}`}>
          {date.getDate()}
        </span>
        <div className="day-cell__dots">
          {events.slice(0, 5).map(e => (
            <span
              key={e.id}
              className="event-dot"
              style={{ background: e.color || EVENT_COLORS[e.type] || EVENT_COLORS.google }}
              title={e.summary}
            />
          ))}
          {events.length > 5 && <span className="event-dot-more">+{events.length - 5}</span>}
        </div>
      </div>

      {/* Screen: small text notes */}
      <div className="day-cell__note screen-only">
        {note && <span className="day-cell__note-text">{note}</span>}
      </div>

      {/* Print: ruled lines for handwriting */}
      <div className="day-cell__lines print-only" aria-hidden="true">
        <div className="day-cell__line" />
        <div className="day-cell__line" />
      </div>
    </div>
  );
}
