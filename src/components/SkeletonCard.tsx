export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0" />
        <div className="w-16 h-6 rounded-full bg-white/5" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="h-3 bg-white/5 rounded w-20" />
        <div className="h-3 bg-white/5 rounded w-12" />
      </div>
    </div>
  );
}
