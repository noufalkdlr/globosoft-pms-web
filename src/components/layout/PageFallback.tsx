import { GlassCard } from "../ui/GlassCard";

// Shown for a moment while a page that is loaded on demand arrives
export function PageFallback() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-white/10" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <GlassCard key={index} className="h-20 animate-pulse p-4" />
        ))}
      </div>
      <GlassCard className="h-64 animate-pulse p-4" />
    </div>
  );
}
