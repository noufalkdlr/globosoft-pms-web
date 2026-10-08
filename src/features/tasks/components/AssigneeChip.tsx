import { Avatar } from "../../../components/ui/Avatar";
import { cn } from "../../../utils/cn";

interface AssigneeChipProps {
  name: string;
  className?: string;
  // In a narrow place show only the avatar: a name squeezed to one letter helps
  // nobody. The name is still read out, and appears on hover. Needs a
  // `@container` around it to know what "narrow" is.
  hideNameWhenNarrow?: boolean;
}

// A designer: their avatar and name.
export function AssigneeChip({ name, className, hideNameWhenNarrow = false }: AssigneeChipProps) {
  return (
    <span
      className={cn("flex min-w-0 items-center gap-2", className)}
      title={hideNameWhenNarrow ? name : undefined}
    >
      <Avatar name={name} size="sm" />
      {hideNameWhenNarrow ? (
        <span className="w-0 truncate @min-[14rem]:w-auto">{name}</span>
      ) : (
        name
      )}
    </span>
  );
}
