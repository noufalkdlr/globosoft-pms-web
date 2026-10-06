import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listContentTypesApi } from "../api/contentTypesApi";

// The list rarely changes, so it is cached longer than the default
export function useContentTypes() {
  return useQuery({
    queryKey: queryKeys.contentTypes.all,
    queryFn: listContentTypesApi,
    staleTime: 1000 * 60 * 5,
  });
}
