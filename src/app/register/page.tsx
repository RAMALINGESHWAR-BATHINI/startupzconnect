import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Create an Account | startupZconnect',
  description: 'Join startupZconnect as a student, professional, startup founder, investor, or mentor.',
};

export default function Page() {
  return <RegisterClient />;
}
