import { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import { MONTH_NAMES } from '../../utils/dateUtils';
import { fetchGoogleContacts, fetchContactPhoto } from '../../utils/googleApi';

export default function ContactModal({ onClose }) {
  const { contacts, addContact, updateContact, deleteContact } = useCalendar();
  const { accessToken } = useAuth();
  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit' | 'import'
  const [editingContact, setEditingContact] = useState(null);
  const [importedContacts, setImportedContacts] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  async function handleImportGoogle() {
    if (!accessToken) { setImportError('Sign in with Google first.'); return; }
    setImportLoading(true);
    setImportError('');
    try {
      const connections = await fetchGoogleContacts(accessToken);
      const parsed = connections
        .filter(p => p.names?.length)
        .map(p => {
          const name = p.names?.[0]?.displayName || '';
          const phone = p.phoneNumbers?.[0]?.value || '';
          const photoUrl = p.photos?.find(ph => !ph.default)?.url || '';
          const bd = p.birthdays?.[0]?.date;
          return { name, phone, photoUrl, birthday: bd ? { month: bd.month, day: bd.day } : null };
        })
        .filter(p => p.birthday);
      setImportedContacts(parsed);
      setView('import');
    } catch (e) {
      setImportError(e.message || 'Failed to import contacts');
    } finally {
      setImportLoading(false);
    }
  }

  async function handleImportSelect(contact) {
    let photo = null;
    if (contact.photoUrl && accessToken) {
      photo = await fetchContactPhoto(contact.photoUrl, accessToken);
    }
    addContact({ ...contact, photo });
  }

  if (view === 'import') {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal modal--tall">
          <div className="modal__header">
            <h2 className="modal__title">Import from Google Contacts</h2>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
          <div className="modal__body">
            {importedContacts.length === 0
              ? <p className="modal__empty">No contacts with birthdays found.</p>
              : importedContacts.map((c, i) => (
                <div key={i} className="import-row">
                  <div className="import-row__info">
                    {c.photoUrl
                      ? <img src={c.photoUrl} alt="" className="import-avatar" />
                      : <div className="import-avatar import-avatar--placeholder">{c.name[0]}</div>}
                    <div>
                      <div className="import-row__name">{c.name}</div>
                      {c.birthday && (
                        <div className="import-row__bd">
                          {MONTH_NAMES[(c.birthday.month || 1) - 1]} {c.birthday.day}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => handleImportSelect(c)}
                  >Add</button>
                </div>
              ))
            }
          </div>
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={() => setView('list')}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'add' || view === 'edit') {
    return <ContactForm
      contact={editingContact}
      onSave={(data) => {
        if (view === 'edit' && editingContact) {
          updateContact(editingContact.id, data);
        } else {
          addContact(data);
        }
        setView('list');
      }}
      onCancel={() => setView('list')}
      onClose={onClose}
    />;
  }

  // List view
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--tall">
        <div className="modal__header">
          <h2 className="modal__title">People & Birthdays</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          <div className="contact-actions">
            <button className="btn btn--primary btn--sm" onClick={() => { setEditingContact(null); setView('add'); }}>
              + Add Person
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={handleImportGoogle}
              disabled={importLoading}
            >
              {importLoading ? 'Loading…' : 'Import from Google Contacts'}
            </button>
          </div>
          {importError && <div className="modal__error">{importError}</div>}

          {contacts.length === 0 && (
            <p className="modal__empty">No people added yet. Add birthdays and anniversaries to see them on the calendar.</p>
          )}

          {contacts.map(contact => (
            <div key={contact.id} className="contact-row">
              <div className="contact-row__avatar">
                {contact.photo
                  ? <img src={contact.photo} alt={contact.name} />
                  : <span>{contact.name[0]}</span>}
              </div>
              <div className="contact-row__info">
                <div className="contact-row__name">{contact.name}</div>
                {contact.birthday && (
                  <div className="contact-row__detail">
                    🎂 {MONTH_NAMES[(contact.birthday.month || 1) - 1]} {contact.birthday.day}
                  </div>
                )}
                {contact.anniversary && (
                  <div className="contact-row__detail">
                    💍 {MONTH_NAMES[(contact.anniversary.month || 1) - 1]} {contact.anniversary.day}
                  </div>
                )}
                {contact.phone && (
                  <div className="contact-row__detail">📞 {contact.phone}</div>
                )}
              </div>
              <div className="contact-row__btns">
                <button className="icon-btn" onClick={() => { setEditingContact(contact); setView('edit'); }} title="Edit">✏️</button>
                <button className="icon-btn icon-btn--danger" onClick={() => { if (confirm('Remove this person?')) deleteContact(contact.id); }} title="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ContactForm({ contact, onSave, onCancel, onClose }) {
  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [bdMonth, setBdMonth] = useState(String(contact?.birthday?.month || 1));
  const [bdDay, setBdDay] = useState(String(contact?.birthday?.day || ''));
  const [hasAnn, setHasAnn] = useState(!!contact?.anniversary);
  const [annMonth, setAnnMonth] = useState(String(contact?.anniversary?.month || 1));
  const [annDay, setAnnDay] = useState(String(contact?.anniversary?.day || ''));
  const [photo, setPhoto] = useState(contact?.photo || '');
  const [error, setError] = useState('');

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!bdDay) { setError('Birthday day is required.'); return; }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      photo: photo || null,
      birthday: { month: parseInt(bdMonth), day: parseInt(bdDay) },
      anniversary: hasAnn && annDay ? { month: parseInt(annMonth), day: parseInt(annDay) } : null,
    });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{contact ? 'Edit Person' : 'Add Person'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          {error && <div className="modal__error">{error}</div>}

          <div className="form-row">
            <label className="form-label">Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
          </div>

          <div className="form-row">
            <label className="form-label">Phone (WhatsApp / Call)</label>
            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 83 123 4567" />
          </div>

          <div className="form-row form-row--inline">
            <div style={{ flex: 1 }}>
              <label className="form-label">Birthday Month *</label>
              <select className="form-input" value={bdMonth} onChange={e => setBdMonth(e.target.value)}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Day *</label>
              <input className="form-input" type="number" min={1} max={31} value={bdDay} onChange={e => setBdDay(e.target.value)} placeholder="Day" required />
            </div>
          </div>

          <div className="form-row form-row--inline">
            <label className="form-check">
              <input type="checkbox" checked={hasAnn} onChange={e => setHasAnn(e.target.checked)} />
              Add Anniversary
            </label>
          </div>

          {hasAnn && (
            <div className="form-row form-row--inline">
              <div style={{ flex: 1 }}>
                <label className="form-label">Anniversary Month</label>
                <select className="form-input" value={annMonth} onChange={e => setAnnMonth(e.target.value)}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
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
              {photo && <img src={photo} alt="Preview" className="photo-preview" />}
              <label className="btn btn--sm btn--ghost btn--upload">
                {photo ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {photo && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPhoto('')}>Remove</button>}
            </div>
          </div>

          <div className="modal__footer">
            <button className="btn btn--primary" type="submit">Save</button>
            <button className="btn btn--ghost" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
