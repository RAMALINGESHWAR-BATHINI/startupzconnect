import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Startups Directory | startupZconnect',
  description: 'Browse and discover startups on startupZconnect. Filter by stage, location, and more.',
  openGraph: {
    title: 'Startups Directory | startupZconnect',
    description: 'Browse and discover startups on startupZconnect.',
    type: 'website',
  },
};

export default function StartupsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

