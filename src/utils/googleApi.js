const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const PEOPLE_BASE = 'https://people.googleapis.com/v1';

async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCalendarEvents(token, year, month) {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const params = new URLSearchParams({
    timeMin: start,
    timeMax: end,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });
  const data = await apiFetch(`${CALENDAR_BASE}/calendars/primary/events?${params}`, token);
  return data.items || [];
}

export async function createCalendarEvent(token, event) {
  return apiFetch(`${CALENDAR_BASE}/calendars/primary/events`, token, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateCalendarEvent(token, eventId, event) {
  return apiFetch(`${CALENDAR_BASE}/calendars/primary/events/${eventId}`, token, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export async function deleteCalendarEvent(token, eventId) {
  const res = await fetch(`${CALENDAR_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

export async function fetchGoogleContacts(token) {
  const params = new URLSearchParams({
    personFields: 'names,photos,birthdays,phoneNumbers',
    pageSize: '1000',
  });
  const data = await apiFetch(`${PEOPLE_BASE}/people/me/connections?${params}`, token);
  return data.connections || [];
}

export async function fetchContactPhoto(photoUrl, token) {
  const res = await fetch(photoUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Google Calendar colorId -> hex
export const GOOGLE_COLORS = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA',
  '4': '#E67C73', '5': '#F6BF26', '6': '#F4511E',
  '7': '#039BE5', '8': '#616161', '9': '#3F51B5',
  '10': '#0B8043', '11': '#D50000',
};

export function googleEventColor(event) {
  return GOOGLE_COLORS[event.colorId] || '#3A86FF';
}
