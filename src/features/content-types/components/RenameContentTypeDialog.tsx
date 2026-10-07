import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { getErrorMessage } from "../../../lib/api/errors";
import { useUpdateContentType } from "../hooks/useUpdateContentType";

import type { ContentType } from "../types/contentTypeTypes";

const MAX_NAME_LENGTH = 40;

interface RenameContentTypeDialogProps {
  contentType: ContentType;
  onClose: () => void;
}

// Mount it only while it is open: it starts from the type's current name.
// Cards the app named after this type ("Poster 3") follow the new name.
export function RenameContentTypeDialog({
  contentType,
  onClose,
}: RenameContentTypeDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const updateType = useUpdateContentType();

  const [name, setName] = useState(contentType.name);
  const [error, setError] = useState<string>();

  const isSaving = updateType.isPending;

  function requestClose() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const cleaned = name.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setError("Enter a name for the content type.");
      return;
    }

    if (cleaned.length > MAX_NAME_LENGTH) {
      setError(`Use ${MAX_NAME_LENGTH} characters or fewer for the name.`);
      return;
    }

    // Nothing to save
    if (cleaned === contentType.name) {
      onClose();
      return;
    }

    setError(undefined);
    updateType.mutate(
      { id: contentType.id, data: { name: cleaned } },
      {
        onSuccess: onClose,
        onError: (saveError) => setError(getErrorMessage(saveError)),
      },
    );
  }

  return (
    <Modal
      open
      onClose={requestClose}
      title="Rename content type"
      description="Cards named after it, like “Poster 3”, get the new name too."
      className="max-w-md"
      footer={
        <>
          <Button variant="ghost" disabled={isSaving} onClick={requestClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSaving}>
            Save
          </Button>
        </>
      }
    >
      <form ref={formRef} id={formId} onSubmit={handleSubmit} noValidate>
        <Input
          label="Name"
          data-autofocus
          value={name}
          error={error}
          disabled={isSaving}
          maxLength={MAX_NAME_LENGTH + 20}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
        />
      </form>
    </Modal>
  );
}
