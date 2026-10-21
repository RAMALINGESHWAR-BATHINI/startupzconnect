import type { Metadata } from 'next';
import GrantsClient from './GrantsClient';

export const metadata: Metadata = {
  title: 'Grants & Government Schemes | startupZconnect',
  description: 'Curated Indian startup funding schemes and government grants most founders never hear about.',
};

export default function Page() {
  return <GrantsClient />;
}
