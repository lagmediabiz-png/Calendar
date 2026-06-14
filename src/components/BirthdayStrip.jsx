import { useCalendar } from '../context/CalendarContext';
import { MONTH_NAMES } from '../utils/dateUtils';

export default function BirthdayStrip({ onAddContact }) {
  const { birthdaysThisMonth, currentMonth } = useCalendar();

  return (
    <div className="birthday-strip">
      <div className="birthday-strip__label">
        {birthdaysThisMonth.length > 0
          ? `Birthdays in ${MONTH_NAMES[currentMonth]}`
          : `No birthdays in ${MONTH_NAMES[currentMonth]}`}
      </div>
      <div className="birthday-strip__faces">
        {birthdaysThisMonth.map(contact => (
          <BirthdayFace key={contact.id} contact={contact} />
        ))}
        <button className="birthday-strip__add no-print" onClick={onAddContact} title="Add person">
          <span>+</span>
        </button>
      </div>
    </div>
  );
}

function BirthdayFace({ contact }) {
  const day = contact.birthday?.day;

  return (
    <div className="birthday-face" title={`${contact.name} — ${day ? `${day}` : ''}`}>
      <div className="birthday-face__avatar">
        {contact.photo
          ? <img src={contact.photo} alt={contact.name} />
          : <span>{contact.name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="birthday-face__name">{contact.name.split(' ')[0]}</div>
      {day && <div className="birthday-face__day">{day}</div>}
    </div>
  );
}
