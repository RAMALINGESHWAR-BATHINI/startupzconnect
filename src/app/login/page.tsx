import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Log In | startupZconnect',
  description: 'Log in to your startupZconnect account.',
};

export default function Page() {
  return <LoginClient />;
}
