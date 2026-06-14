import { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { MONTH_NAMES } from '../utils/dateUtils';

const MONTH_NOTE_KEY = (y, m) => `month-notes-${y}-${m}`;

export default function MonthNotes() {
  const { currentYear, currentMonth, saveNote, notes } = useCalendar();
  const key = MONTH_NOTE_KEY(currentYear, currentMonth);
  const [value, setValue] = useState(notes[key] || '');

  function handleChange(e) {
    setValue(e.target.value);
    saveNote(key, e.target.value);
  }

  return (
    <div className="month-notes">
      <div className="month-notes__label">
        Notes for {MONTH_NAMES[currentMonth]} {currentYear}
      </div>

      {/* Screen: editable textarea */}
      <textarea
        className="month-notes__textarea screen-only"
        value={value}
        onChange={handleChange}
        placeholder="Type monthly notes here…"
        rows={4}
      />

      {/* Print: ruled lines */}
      <div className="month-notes__lines print-only" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="month-notes__line" />
        ))}
      </div>
    </div>
  );
}
