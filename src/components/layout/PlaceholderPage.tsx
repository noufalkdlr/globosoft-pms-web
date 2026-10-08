import { PageHeader } from "./PageHeader";
import { GlassCard } from "../ui/GlassCard";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

// TEMPORARY: a heading plus sample cards, so the shell (and the glass effect
// over scrolling content) can be judged before the real pages exist.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <GlassCard key={index} className="h-40 p-5">
            <p className="text-sm text-muted-foreground">
              Sample card {index + 1}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
