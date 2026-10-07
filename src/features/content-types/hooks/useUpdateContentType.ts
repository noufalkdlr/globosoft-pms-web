import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { updateContentTypeApi } from "../api/contentTypesApi";

import type {
  ContentType,
  ContentTypeUpdateRequest,
} from "../types/contentTypeTypes";

interface UpdateContentTypeVariables {
  id: number;
  data: ContentTypeUpdateRequest;
}

// Renames a content type, or turns it off or on (admins only)
export function useUpdateContentType() {
  const queryClient = useQueryClient();

  return useMutation<ContentType, Error, UpdateContentTypeVariables>({
    mutationFn: ({ id, data }) => updateContentTypeApi(id, data),
    onSuccess: (contentType, { data }) => {
      queryClient.setQueryData<ContentType[]>(
        queryKeys.contentTypes.all,
        (current) =>
          current?.map((item) =>
            item.id === contentType.id ? contentType : item,
          ),
      );

      // Cards, plans and overviews show the type's name, and the cards the app
      // named after it follow a rename
      void queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.overviewAll });

      if (data.name !== undefined) {
        toast.success(`Renamed to ${contentType.name}`);
      } else if (data.is_active === false) {
        toast.success(`${contentType.name} turned off`);
      } else {
        toast.success(`${contentType.name} turned on`);
      }
    },
  });
}
