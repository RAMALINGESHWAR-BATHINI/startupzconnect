import type { Metadata } from 'next';
import CofoundersClient from './CofoundersClient';

export const metadata: Metadata = {
  title: 'Find a Co-founder | startupZconnect',
  description: 'Technical founders looking for business partners, and vice versa — post a listing or browse active ones.',
};

export default function Page() {
  return <CofoundersClient />;
}
