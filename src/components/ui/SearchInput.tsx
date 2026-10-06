import { Search, X } from "lucide-react";

import { cn } from "../../utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // Describes the field for screen readers, e.g. "Search clients"
  label: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  label,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />

      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 w-full rounded-xl border border-border bg-white/5 pl-11 pr-11 text-foreground outline-none transition",
          "placeholder:text-muted-foreground/60 focus:border-brand/60 focus:ring-4 focus:ring-brand/20",
          // Hide the browser's own clear button, ours is styled to match
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />

      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
