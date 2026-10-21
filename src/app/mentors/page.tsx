import type { Metadata } from 'next';
import MentorsClient from './MentorsClient';

export const metadata: Metadata = {
  title: 'Mentors | startupZconnect',
  description: 'Experienced operators offering founders their time and expertise, not money.',
};

export default function Page() {
  return <MentorsClient />;
}
