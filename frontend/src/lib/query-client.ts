import { MutationCache, QueryClient, type DefaultOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api-errors";

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  },
};

const mutationCache = new MutationCache({
  onError: (error, _variables, _result, mutation) => {
    if (mutation.meta?.skipGlobalErrorToast) return;
    toast.error(formatApiError(error));
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions,
});
