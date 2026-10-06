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
      // Add the new type to the cached list right away, so a dropdown that
      // selects it does not flash empty while the list refetches
      queryClient.setQueryData<ContentType[]>(
        queryKeys.contentTypes.all,
        (current) => (current ? [...current, contentType] : current),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.contentTypes.all,
      });
      toast.success(`${contentType.name} added`);
    },
  });
}
