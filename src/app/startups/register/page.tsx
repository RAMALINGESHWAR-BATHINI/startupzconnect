import type { Metadata } from 'next';
import StartupRegisterUnified from './StartupRegisterUnified';

export const metadata: Metadata = {
  title: 'Register Your Startup | startupZconnect',
  description: 'Create your account and register your startup in one seamless flow.',
};

export default function Page() {
  return <StartupRegisterUnified />;
}

