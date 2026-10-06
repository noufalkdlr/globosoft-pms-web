import { useState, type FormEvent } from "react";
import { UserRound } from "lucide-react";

import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { isValidEmail } from "../../../utils/email";
import { DEMO_ACCOUNTS } from "../api/dummyAuth";

interface AccountChooserProps {
  onSelect: (email: string) => void;
  onCancel: () => void;
}

const ROW_CLASS =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/5";

// TEMPORARY: imitates Google's "Choose an account" screen so the login flow
// can be demoed before the real Google button is connected. Replace with the
// real Google sign-in button (and delete this file) when the backend is ready.
//
// The three demo accounts sign in with one click. "Use another account" lets
// you type any Gmail address, to try someone an admin just added (or someone
// who was never added, or was deactivated).
export function AccountChooser({ onSelect, onCancel }: AccountChooserProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    onSelect(email.trim());
  }

  if (isTyping) {
    return (
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <p className="text-sm font-medium">Use another account</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Type the Gmail address to sign in with
          </p>
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="off"
          placeholder="name@gmail.com"
          data-autofocus
          value={email}
          error={error}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(undefined);
          }}
        />

        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={() => setIsTyping(false)}>
            Back
          </Button>
          <Button type="submit" fullWidth>
            Continue
          </Button>
        </div>
      </form>
    );
  }

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
            onClick={() => setIsTyping(true)}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm">Use another account</span>
              <span className="block truncate text-xs text-muted-foreground">
                Type a Gmail address
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
