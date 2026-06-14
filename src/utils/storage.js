const CONTACTS_KEY = 'calendar_contacts';
const NOTES_KEY = 'calendar_notes';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Contacts ──────────────────────────────────────────────────────────────
export function loadContacts() {
  try {
    return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveContacts(contacts) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export function addContact(contact) {
  const contacts = loadContacts();
  const newContact = { id: uid(), ...contact };
  contacts.push(newContact);
  saveContacts(contacts);
  return newContact;
}

export function updateContact(id, updates) {
  const contacts = loadContacts().map(c => c.id === id ? { ...c, ...updates } : c);
  saveContacts(contacts);
  return contacts.find(c => c.id === id);
}

export function deleteContact(id) {
  saveContacts(loadContacts().filter(c => c.id !== id));
}

// ── Notes (keyed by "YYYY-MM-DD") ─────────────────────────────────────────
export function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveNote(dateKey, text) {
  const notes = loadNotes();
  if (text.trim()) {
    notes[dateKey] = text;
  } else {
    delete notes[dateKey];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
