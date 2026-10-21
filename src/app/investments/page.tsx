import type { Metadata } from 'next';
import InvestmentsClient from './InvestmentsClient';

export const metadata: Metadata = {
  title: 'Express Investment Interest | startupZconnect',
  description: 'Discover field-verified startups raising funds and express investment interest with your thesis and ticket size.',
};

export default function Page() {
  return <InvestmentsClient />;
}
