import { supabase } from './supabase';

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const api = {
  auth: {
    getSession: async () => unwrap(await supabase.auth.getSession()),
    onAuthStateChange: callback => supabase.auth.onAuthStateChange(callback),
    signIn: async (email, password) => unwrap(await supabase.auth.signInWithPassword({ email, password })),
    signUp: async (email, password) => unwrap(await supabase.auth.signUp({ email, password })),
    signOut: async () => unwrap(await supabase.auth.signOut()),
  },
  profile: async userId => unwrap(await supabase.from('users').select('id,email,role').eq('id', userId).maybeSingle()),
  events: async () => unwrap(await supabase.from('events').select('id,organiser_id,title,capacity,timestamp').order('timestamp', { ascending: true })),
  event: async id => unwrap(await supabase.from('events').select('id,organiser_id,title,capacity,timestamp').eq('id', id).single()),
  myRegistrations: async userId => unwrap(await supabase.from('registrations').select('id,user_id,event_id,created_at').eq('user_id', userId).order('created_at', { ascending: false })),
  register: async (userId, eventId) => {
    // This pre-check improves the message shown to users. A UNIQUE(user_id,event_id)
    // database constraint is still required to prevent simultaneous duplicate inserts.
    const existing = unwrap(await supabase.from('registrations').select('id').eq('user_id', userId).eq('event_id', eventId).maybeSingle());
    if (existing) throw new Error('You are already registered for this event.');
    return unwrap(await supabase.from('registrations').insert({ user_id: userId, event_id: eventId }).select().single());
  },
  eventRegistrations: async eventId => {
    const registrations = unwrap(await supabase.from('registrations').select('id,user_id,event_id,created_at').eq('event_id', eventId).order('created_at', { ascending: true }));
    if (!registrations.length) return [];
    const ids = [...new Set(registrations.map(row => row.user_id).filter(Boolean))];
    const profiles = unwrap(await supabase.from('users').select('id,email,role').in('id', ids));
    const byId = Object.fromEntries(profiles.map(profile => [profile.id, profile]));
    return registrations.map(row => ({ ...row, user: byId[row.user_id] || null }));
  },
  createEvent: async ({ title, capacity, timestamp, organiser_id }) => unwrap(await supabase.from('events').insert({ title, capacity, timestamp, organiser_id }).select().single()),
};

export function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.data || payload?.events || payload?.registrations || payload?.attendees || [];
}

export function normalizeEvent(e = {}) {
  return {
    id: e.id ?? 'event', title: e.title ?? 'Untitled campus event',
    description: e.description ?? 'Meet your campus community, learn something new, and earn XP.',
    category: e.category ?? 'Campus', date: e.date ?? e.timestamp ?? '', time: e.time ?? '',
    venue: e.venue ?? 'Campus venue', organizer: e.organizer ?? 'CampusConnect',
    capacity: Number(e.capacity ?? 0), attendees: Number(e.attendees ?? e.attendeeCount ?? 0),
    xp: Number(e.xp ?? 120), image: e.imageUrl ?? '', organiserId: e.organiser_id, raw: e,
  };
}

export function normalizeRegistration(r = {}) {
  const e = r.event || {};
  return {
    ...r, id: r.id ?? r.registration_id ?? `${r.eventId ?? r.event_id ?? e.id ?? 'registration'}`,
    eventId: r.eventId ?? r.event_id ?? e.id, title: r.title ?? e.title ?? 'Registered campus event',
    date: r.date ?? e.date ?? e.timestamp ?? '', venue: r.venue ?? e.venue ?? 'Campus venue',
    status: r.status ?? 'Registered',
  };
}
