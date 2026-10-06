import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "../../utils/cn";

// Google's official 4-color "G" mark
function GoogleLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

interface GoogleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

// Follows Google's "dark" button theme (colors are mandated by their brand
// guidelines), which also fits this app's dark surfaces.
export function GoogleButton({
  loading,
  disabled,
  className,
  ...props
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      // Block clicks while signing in to prevent double submits
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#8e918f] bg-[#131314] px-6 text-sm font-medium text-[#e3e3e3] transition",
        "hover:bg-[#1f1f21] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleLogo />
      )}
      Continue with Google
    </button>
  );
}
