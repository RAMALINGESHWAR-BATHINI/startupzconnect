export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{title}</h1>
        {sub && <p className="text-slate-400 text-sm">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
