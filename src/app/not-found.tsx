import Link from 'next/link';
import { ArrowLeft, Rocket } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>
      <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6">
        <Rocket className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-6xl font-extrabold text-white mb-3">404</h1>
      <p className="text-xl font-semibold text-slate-300 mb-2">Page not found</p>
      <p className="text-slate-400 text-sm max-w-xs mb-8">
        This page doesn&apos;t exist or may have been moved. Head back to explore startups.
      </p>
      <Link href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
