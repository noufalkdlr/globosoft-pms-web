import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { createContentTypeApi } from "../api/contentTypesApi";

import type {
  ContentType,
  ContentTypeCreateRequest,
} from "../types/contentTypeTypes";

export function useCreateContentType() {
  const queryClient = useQueryClient();

  return useMutation<ContentType, Error, ContentTypeCreateRequest>({
    mutationFn: createContentTypeApi,
    onSuccess: (contentType) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.contentTypes.all,
      });
      toast.success(`${contentType.name} added`);
    },
  });
}
