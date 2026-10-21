import type { Metadata } from 'next';
import PressClient from './PressClient';

export const metadata: Metadata = {
  title: 'Press & Media Requests | startupZconnect',
  description: 'Journalists looking for startup stories — free visibility for the startups that respond.',
};

export default function Page() {
  return <PressClient />;
}
