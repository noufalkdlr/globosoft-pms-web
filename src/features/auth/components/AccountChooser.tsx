import { UserRound } from "lucide-react";

import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { DEMO_ACCOUNTS, NOT_ADDED_EMAIL } from "../api/dummyAuth";

interface AccountChooserProps {
  onSelect: (email: string) => void;
  onCancel: () => void;
}

const ROW_CLASS =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/5";

// TEMPORARY: imitates Google's "Choose an account" screen so the login flow
// can be demoed before the real Google button is connected. Replace with the
// real Google sign-in button (and delete this file) when the backend is ready.
export function AccountChooser({ onSelect, onCancel }: AccountChooserProps) {
  return (
    <div className="mt-6">
      <p className="text-sm font-medium">Choose an account</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Demo accounts, no real Google sign-in yet
      </p>

      <ul className="mt-3 space-y-1">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.id}>
            <button
              type="button"
              className={ROW_CLASS}
              onClick={() => onSelect(account.email)}
            >
              <Avatar name={account.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm">{account.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {account.email}
                </span>
              </span>
            </button>
          </li>
        ))}

        <li>
          <button
            type="button"
            className={ROW_CLASS}
            onClick={() => onSelect(NOT_ADDED_EMAIL)}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm">
                Use another account
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Not added by an admin
              </span>
            </span>
          </button>
        </li>
      </ul>

      <Button variant="ghost" fullWidth className="mt-3" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
