import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CalendarProvider } from './context/CalendarContext';
import CalendarHeader from './components/CalendarHeader';
import BirthdayStrip from './components/BirthdayStrip';
import CalendarGrid from './components/CalendarGrid';
import MonthNotes from './components/MonthNotes';
import DayModal from './components/modals/DayModal';
import AddEventModal from './components/modals/AddEventModal';
import ContactModal from './components/modals/ContactModal';

function CalendarApp() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [addEventDate, setAddEventDate] = useState(null); // Date | null

  function openAddEvent(date) {
    setAddEventDate(date || new Date());
  }

  return (
    <div className="app-page">
      <CalendarHeader onAddContact={() => setShowContactModal(true)} />
      <BirthdayStrip onAddContact={() => setShowContactModal(true)} />
      <CalendarGrid />
      <MonthNotes />

      {/* Day details modal — closes itself via setSelectedDay(null) */}
      <DayModal onAddEvent={openAddEvent} />

      {/* Add event / add contact modal */}
      {addEventDate && (
        <AddEventModal
          date={addEventDate}
          onClose={() => setAddEventDate(null)}
          onSaved={() => setAddEventDate(null)}
        />
      )}

      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CalendarProvider>
        <CalendarApp />
      </CalendarProvider>
    </AuthProvider>
  );
}
