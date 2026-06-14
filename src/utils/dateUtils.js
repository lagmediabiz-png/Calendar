export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function getCalendarDays(year, month) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Convert getDay() to Monday-first (Mon=0 ... Sun=6)
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days = [];

  // Pad with previous month days
  const prevLastDate = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevLastDate - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Pad with next month days to fill 42 slots (6 rows)
  let nextDay = 1;
  while (days.length < 42) {
    days.push({ date: new Date(year, month + 1, nextDay++), isCurrentMonth: false });
  }

  return days;
}

export function toDateKey(date) {
  // Returns "YYYY-MM-DD"
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function isToday(date) {
  return sameDay(date, new Date());
}

export function eventDateKey(isoString) {
  return isoString ? isoString.slice(0, 10) : null;
}

export function formatEventTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Returns true if contact birthday/anniversary falls on this calendar day
export function contactOccursOn(contact, calDate) {
  const m = calDate.getMonth() + 1; // 1-12
  const d = calDate.getDate();

  if (contact.birthday && contact.birthday.month === m && contact.birthday.day === d) return 'birthday';
  if (contact.anniversary && contact.anniversary.month === m && contact.anniversary.day === d) return 'anniversary';
  return null;
}
