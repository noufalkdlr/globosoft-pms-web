import type { ReactNode } from "react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  // Buttons or controls at the right end (Add client, the month switcher)
  actions?: ReactNode;
  // The browser tab's name, when the title is not plain text (a greeting)
  documentTitle?: string;
  // Let the actions drop under the title when there is not room beside it
  wrap?: boolean;
}

// The top of a page: its title, a line saying what it is for, and on the right
// what can be done from it.
export function PageHeader({
  title,
  description,
  actions,
  documentTitle,
  wrap = false,
}: PageHeaderProps) {
  const hasActions = Boolean(actions);

  // The tab shows the page's name
  useDocumentTitle(documentTitle ?? (typeof title === "string" ? title : undefined));

  return (
    <header
      className={cn(
        hasActions && "flex items-start justify-between gap-4",
        hasActions && wrap && "flex-wrap",
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions}
    </header>
  );
}
