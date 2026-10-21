import { LucideIcon } from 'lucide-react';
export function EmptyState({ icon: Icon, title, sub, action }: { icon: LucideIcon; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <Icon className="w-12 h-12 text-slate-700" />
      <p className="text-white font-medium">{title}</p>
      {sub && <p className="text-slate-500 text-sm max-w-xs">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
