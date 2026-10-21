'use client';
import { useState } from 'react';

export function StarDisplay({ value, max = 5, size = 'sm' }: { value: number; max?: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <span className={`inline-flex gap-0.5 ${sz}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(value) ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-0.5 text-xl cursor-pointer">
      {[1,2,3,4,5].map(i => (
        <span key={i}
          className={i <= (hover || value) ? 'star-filled' : 'star-empty'}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}>★</span>
      ))}
    </span>
  );
}
