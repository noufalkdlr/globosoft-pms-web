import { useId, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { getErrorMessage } from "../../../lib/api/errors";
import { isValidEmail, normalizeEmail } from "../../../utils/email";
import { useTeams } from "../../teams/hooks/useTeams";
import { useCreateUser } from "../hooks/useCreateUser";
import { useUpdateUser } from "../hooks/useUpdateUser";

import type { UserRole } from "../../auth/types/authTypes";
import type { UserRecord, UserUpdateRequest } from "../types/userTypes";

const MAX_NAME_LENGTH = 80;

interface UserFormDialogProps {
  // null = adding someone, a person = editing them
  user: UserRecord | null;
  // True when editing the signed-in admin: role and email are locked
  isYou: boolean;
  onClose: () => void;
}

// Mount it only while it should be open: it reads its starting values from
// props once, so every open starts from a clean form.
export function UserFormDialog({ user, isYou, onClose }: UserFormDialogProps) {
  const isEdit = user !== null;
  const formId = useId();

  const teamsQuery = useTeams();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSaving = createUser.isPending || updateUser.isPending;

  const [initial] = useState(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: (user?.role ?? "member") as UserRole,
    teamId: user?.team ? String(user.team.id) : "",
  }));

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [role, setRole] = useState<UserRole>(initial.role);
  const [teamId, setTeamId] = useState(initial.teamId);

  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [teamError, setTeamError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const isDirty =
    name.trim() !== initial.name.trim() ||
    email.trim().toLowerCase() !== initial.email ||
    role !== initial.role ||
    (role === "member" && teamId !== initial.teamId);

  function requestClose() {
    if (isSaving) {
      return;
    }

    if (isDirty) {
      setIsConfirmingDiscard(true);
      return;
    }

    onClose();
  }

  // The server's answer, put where the person will look for it
  function handleSaveError(error: Error) {
    const message = getErrorMessage(error);

    if (message.toLowerCase().includes("email")) {
      setEmailError(message);
    } else {
      setFormError(message);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const cleanedName = name.trim().replace(/\s+/g, " ");
    const cleanedEmail = email.trim().toLowerCase();

    const nextNameError = !cleanedName
      ? "Enter the person's name."
      : cleanedName.length > MAX_NAME_LENGTH
        ? `Use ${MAX_NAME_LENGTH} characters or fewer.`
        : undefined;
    const nextEmailError = isValidEmail(cleanedEmail)
      ? undefined
      : "Enter a valid email address.";
    const nextTeamError =
      role === "member" && !teamId ? "Choose a team for this person." : undefined;

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setTeamError(nextTeamError);
    setFormError(undefined);

    if (nextNameError || nextEmailError || nextTeamError) {
      return;
    }

    const newTeamId = role === "member" ? Number(teamId) : null;

    if (!user) {
      createUser.mutate(
        { name: cleanedName, email: cleanedEmail, role, team_id: newTeamId },
        { onSuccess: onClose, onError: handleSaveError },
      );
      return;
    }

    // Send only what changed
    const changes: UserUpdateRequest = {};

    if (cleanedName !== user.name) {
      changes.name = cleanedName;
    }

    if (normalizeEmail(cleanedEmail) !== normalizeEmail(user.email) || cleanedEmail !== user.email) {
      changes.email = cleanedEmail;
    }

    if (role !== user.role) {
      changes.role = role;
    }

    if (newTeamId !== (user.team?.id ?? null)) {
      changes.team_id = newTeamId;
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    updateUser.mutate(
      { id: user.id, data: changes },
      { onSuccess: onClose, onError: handleSaveError },
    );
  }

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={isEdit ? "Edit user" : "Add user"}
        description={
          isEdit
            ? undefined
            : "They sign in with this Gmail account. No password to share."
        }
        className="max-w-md"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-3">
            {formError && (
              <p role="alert" className="mr-auto text-sm text-destructive">
                {formError}
              </p>
            )}
            <Button variant="ghost" disabled={isSaving} onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={isSaving}>
              {isEdit ? "Save changes" : "Add user"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* The visible Save button sits outside this form (in the dialog
              footer). This invisible one makes Enter submit in every browser. */}
          <button type="submit" tabIndex={-1} aria-hidden="true" className="sr-only" />

          <Input
            label="Name"
            autoComplete="off"
            data-autofocus
            value={name}
            error={nameError}
            disabled={isSaving}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
            }}
          />

          <Input
            label="Gmail address"
            type="email"
            autoComplete="off"
            value={email}
            error={emailError}
            disabled={isSaving || isYou}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(undefined);
            }}
          />

          <Select
            label="Role"
            value={role}
            disabled={isSaving || isYou}
            onChange={(event) => {
              setRole(event.target.value as UserRole);
              setTeamError(undefined);
            }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>

          {role === "member" && (
            <div className="space-y-1.5">
              <Select
                label="Team"
                value={teamId}
                error={teamError}
                disabled={isSaving || teamsQuery.isPending || teamsQuery.isError}
                onChange={(event) => {
                  setTeamId(event.target.value);
                  setTeamError(undefined);
                }}
              >
                <option value="">
                  {teamsQuery.isPending ? "Loading teams…" : "Choose a team"}
                </option>
                {(teamsQuery.data ?? []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
              {teamsQuery.isError && (
                <p className="text-sm text-destructive">
                  Couldn't load teams.{" "}
                  <button
                    type="button"
                    onClick={() => teamsQuery.refetch()}
                    className="underline underline-offset-2"
                  >
                    Try again
                  </button>
                </p>
              )}
            </div>
          )}

          {isYou && (
            <p className="text-xs text-muted-foreground">
              You can't change your own role or email, so you can never lock
              yourself out.
            </p>
          )}

          {role === "admin" && !isYou && (
            <p className="text-xs text-muted-foreground">
              Admins can see and change everything. They don't belong to a team.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={isConfirmingDiscard}
        title="Discard your changes?"
        description="What you entered won't be saved."
        confirmLabel="Discard"
        onConfirm={onClose}
        onCancel={() => setIsConfirmingDiscard(false)}
      />
    </>
  );
}
