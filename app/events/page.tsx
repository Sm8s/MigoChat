"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { createEvent, fetchEvents, rsvpEvent } from '@/lib/migo-logic';
import type { Event } from '@/lib/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    const list = await fetchEvents();
    setEvents(list);
  };
  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const isoTime = new Date(`${date}T${time}:00`).toISOString();
      await createEvent(uid, title, description, isoTime, location);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleRsvp = async (eventId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;
    try {
      const res = await rsvpEvent(eventId, uid);
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Events</h1>
      <form onSubmit={handleCreate} className="space-y-2 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="w-full p-2 bg-[#2b2d31] text-white rounded-md"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 bg-[#2b2d31] text-white rounded-md"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 bg-[#2b2d31] text-white rounded-md"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="p-2 bg-[#2b2d31] text-white rounded-md"
          />
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          className="w-full p-2 bg-[#2b2d31] text-white rounded-md"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md"
        >
          {loading ? 'Creating…' : 'Create Event'}
        </button>
      </form>
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-gray-400">No events found.</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="p-3 bg-[#232428] rounded-md border border-[#2b2d31]">
              <h2 className="text-lg font-semibold">{ev.title}</h2>
              {ev.description && <p className="text-sm text-gray-300 mb-1">{ev.description}</p>}
              <p className="text-xs text-gray-400">{new Date(ev.event_time).toLocaleString()}</p>
              {ev.location && <p className="text-xs text-gray-400">{ev.location}</p>}
              <button
                onClick={() => toggleRsvp(ev.id)}
                className="mt-2 px-3 py-1 rounded-md bg-[#3a1f1f] hover:bg-[#4a2323] text-sm"
              >
                RSVP / Cancel
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}