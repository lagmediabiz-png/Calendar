import { useCalendar } from '../context/CalendarContext';
import { getCalendarDays, DAY_NAMES } from '../utils/dateUtils';
import DayCell from './DayCell';

export default function CalendarGrid() {
  const { currentYear, currentMonth } = useCalendar();
  const days = getCalendarDays(currentYear, currentMonth);

  return (
    <div className="cal-grid">
      {/* Day name headers */}
      <div className="cal-grid__header">
        {DAY_NAMES.map(d => (
          <div key={d} className="cal-grid__dayname">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="cal-grid__cells">
        {days.map(({ date, isCurrentMonth }) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            isCurrentMonth={isCurrentMonth}
          />
        ))}
      </div>
    </div>
  );
}
