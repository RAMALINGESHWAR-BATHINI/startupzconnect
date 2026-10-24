'use client';
import { useState } from 'react';

export default function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-center tracking-widest text-lg"
      placeholder="000000"
    />
  );
}
