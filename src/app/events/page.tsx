import type { Metadata } from 'next';
import EventsClient from './EventsClient';

export const metadata: Metadata = {
  title: 'Startup Events | startupZconnect',
  description: 'Demo days, pitch competitions, meetups, and workshops across the startup network.',
};

export default function Page() {
  return <EventsClient />;
}
