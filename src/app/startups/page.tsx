import type { Metadata } from 'next';
import StartupsClient from './StartupsClient';

export const metadata: Metadata = {
  title: 'Browse Verified Startups | startupZconnect',
  description: 'Discover field-verified startups across AI, FinTech, HealthTech, and more. Filter by domain, stage, and trust badge.',
};

export default function StartupsPage() {
  return <StartupsClient />;
}
