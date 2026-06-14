import { useCalendar } from '../context/CalendarContext';
import { useAuth } from '../context/AuthContext';
import { MONTH_NAMES } from '../utils/dateUtils';
import GoogleSignIn from './GoogleSignIn';

export default function CalendarHeader({ onAddContact }) {
  const { currentYear, currentMonth, prevMonth, nextMonth, goToday, loadingEvents } = useCalendar();
  const { userInfo } = useAuth();

  return (
    <div className="cal-header">
      <div className="cal-header__top no-print">
        <GoogleSignIn />
        <div className="cal-header__actions">
          <button className="btn btn--sm btn--ghost" onClick={onAddContact}>+ Add Person</button>
          <button className="btn btn--sm btn--primary" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <div className="cal-header__nav">
        <button className="nav-btn no-print" onClick={prevMonth} aria-label="Previous month">&#8249;</button>
        <div className="cal-header__title">
          <h1 className="cal-header__month">{MONTH_NAMES[currentMonth]}</h1>
          <span className="cal-header__year">{currentYear}</span>
          {loadingEvents && <span className="cal-header__sync no-print">syncing…</span>}
        </div>
        <button className="nav-btn no-print" onClick={nextMonth} aria-label="Next month">&#8250;</button>
      </div>

      <div className="no-print" style={{ textAlign: 'center', marginTop: '4px' }}>
        <button className="btn btn--xs btn--ghost" onClick={goToday}>Today</button>
      </div>
    </div>
  );
}
