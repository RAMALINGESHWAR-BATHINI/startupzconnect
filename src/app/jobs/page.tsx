import type { Metadata } from 'next';
import JobsClient from './JobsClient';

export const metadata: Metadata = {
  title: 'Startup Jobs & Internships | startupZconnect',
  description: 'Browse open roles at verified startups — full-time, internships, and freelance. Filter by type, location, and skills.',
};

export default function JobsPage() {
  return <JobsClient />;
}
