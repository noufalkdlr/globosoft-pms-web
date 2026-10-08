import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Camera, LogOut, Trash2 } from "lucide-react";

import { useLogout } from "../../features/auth/hooks/useLogout";
import { useChangeMyAvatar, useRemoveMyAvatar } from "../../features/users/hooks/useMyAvatar";
import { useDismissable } from "../../hooks/useDismissable";
import { cn } from "../../utils/cn";
import { AVATAR_TYPES } from "../../utils/image";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";

import type { AuthUser } from "../../features/auth/types/authTypes";

interface UserMenuProps {
  user: AuthUser;
}

// The signed-in person: just their avatar in the header, and everything about
// them (name, email, role, team) and Log out in the box that opens from it.
export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const logoutMutation = useLogout();
  const changePhoto = useChangeMyAvatar();
  const removePhoto = useRemoveMyAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Clear the input so choosing the same file again still counts as a change
    event.target.value = "";

    if (file) {
      changePhoto.mutate(file);
    }
  }

  // Keyboard and mouse ways out, only while the box is open. Escape puts focus
  // back on the avatar, so a keyboard user does not lose their place.
  useDismissable([rootRef], () => setIsOpen(false), {
    enabled: isOpen,
    returnFocusTo: buttonRef,
  });

  // A box that has just opened takes focus, so the keyboard works inside it
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account menu, ${user.name}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "rounded-full transition",
          isOpen ? "ring-2 ring-brand/60" : "hover:ring-2 hover:ring-white/15",
        )}
      >
        <Avatar name={user.name} src={user.avatar_url} />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Account"
          tabIndex={-1}
          className="glass-popover absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2.5rem)] rounded-3xl p-2 outline-none"
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar name={user.name} src={user.avatar_url} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <dl className="mx-2.5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 border-t border-border py-3 text-sm">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{user.role === "admin" ? "Admin" : "Member"}</dd>

            {/* An admin belongs to no team */}
            {user.team && (
              <>
                <dt className="text-muted-foreground">Team</dt>
                <dd>{user.team.name}</dd>
              </>
            )}
          </dl>

          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            onChange={handleFileChosen}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          <Button
            variant="ghost"
            fullWidth
            loading={changePhoto.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 justify-start gap-3 px-3.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Camera className="size-5" aria-hidden="true" />
            {user.avatar_url ? "Change photo" : "Add photo"}
          </Button>

          {/* Only their own upload can be removed; a Google photo stays */}
          {user.has_custom_avatar && (
            <Button
              variant="ghost"
              fullWidth
              loading={removePhoto.isPending}
              onClick={() => removePhoto.mutate()}
              className="h-11 justify-start gap-3 px-3.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-5" aria-hidden="true" />
              Remove photo
            </Button>
          )}

          <Button
            variant="ghost"
            fullWidth
            loading={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            className="h-11 justify-start gap-3 px-3.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Log out
          </Button>
        </div>
      )}
    </div>
  );
}
