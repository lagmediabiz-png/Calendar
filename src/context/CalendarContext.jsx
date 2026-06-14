import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchCalendarEvents, googleEventColor } from '../utils/googleApi';
import { loadContacts, saveContacts, loadNotes, saveNote as persistNote } from '../utils/storage';
import { toDateKey, contactOccursOn } from '../utils/dateUtils';

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [googleEvents, setGoogleEvents] = useState([]);
  const [contacts, setContacts] = useState(() => loadContacts());
  const [notes, setNotes] = useState(() => loadNotes());
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // { date, dayEvents }
  const { accessToken, refreshToken } = useAuth();

  // Sync contacts to localStorage whenever they change
  useEffect(() => { saveContacts(contacts); }, [contacts]);

  // Fetch Google Calendar events when month or token changes
  useEffect(() => {
    if (!accessToken) { setGoogleEvents([]); return; }
    let cancelled = false;
    setLoadingEvents(true);
    fetchCalendarEvents(accessToken, currentYear, currentMonth)
      .then(items => {
        if (!cancelled) {
          setGoogleEvents(items.map(e => ({
            id: e.id,
            summary: e.summary || '(no title)',
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
            allDay: !e.start?.dateTime,
            color: googleEventColor(e),
            source: 'google',
            raw: e,
          })));
        }
      })
      .catch(err => {
        if (err.message?.includes('401') && !cancelled) refreshToken();
      })
      .finally(() => { if (!cancelled) setLoadingEvents(false); });
    return () => { cancelled = true; };
  }, [accessToken, currentYear, currentMonth, refreshToken]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(m => {
      if (m === 0) { setCurrentYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(m => {
      if (m === 11) { setCurrentYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const goToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  // Get all events (google + contact birthdays/anniversaries) for a given date
  const getEventsForDate = useCallback((date) => {
    const key = toDateKey(date);
    const events = [];

    // Google Calendar events
    googleEvents.forEach(e => {
      const eKey = e.start ? e.start.slice(0, 10) : null;
      if (eKey === key) events.push(e);
    });

    // Contact birthdays/anniversaries
    contacts.forEach(contact => {
      const type = contactOccursOn(contact, date);
      if (type) {
        events.push({
          id: `contact-${contact.id}-${type}`,
          summary: type === 'birthday'
            ? `${contact.name}'s Birthday`
            : `${contact.name}'s Anniversary`,
          type,
          contact,
          source: 'local',
          color: type === 'birthday' ? '#F06292' : '#AB47BC',
          allDay: true,
        });
      }
    });

    return events;
  }, [googleEvents, contacts]);

  // Contacts whose birthday is in the current month
  const birthdaysThisMonth = contacts.filter(c =>
    c.birthday && c.birthday.month === currentMonth + 1
  );

  const saveNote = useCallback((dateKey, text) => {
    persistNote(dateKey, text);
    setNotes(prev => {
      const next = { ...prev };
      if (text.trim()) next[dateKey] = text;
      else delete next[dateKey];
      return next;
    });
  }, []);

  const addContact = useCallback((contact) => {
    const newContact = { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...contact };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, []);

  const updateContact = useCallback((id, updates) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteContact = useCallback((id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  const refreshGoogleEvents = useCallback(() => {
    if (!accessToken) return;
    setLoadingEvents(true);
    fetchCalendarEvents(accessToken, currentYear, currentMonth)
      .then(items => setGoogleEvents(items.map(e => ({
        id: e.id,
        summary: e.summary || '(no title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        allDay: !e.start?.dateTime,
        color: googleEventColor(e),
        source: 'google',
        raw: e,
      }))))
      .finally(() => setLoadingEvents(false));
  }, [accessToken, currentYear, currentMonth]);

  return (
    <CalendarContext.Provider value={{
      currentYear, currentMonth,
      googleEvents, contacts, notes, loadingEvents,
      selectedDay, setSelectedDay,
      birthdaysThisMonth,
      prevMonth, nextMonth, goToday,
      getEventsForDate,
      saveNote,
      addContact, updateContact, deleteContact,
      refreshGoogleEvents,
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendar = () => useContext(CalendarContext);
