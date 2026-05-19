import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { QueryCache, MutationCache } from "@tanstack/react-query";
import { useSessionStore } from "@/stores/useSessionStore";
import { refreshTokensFn } from "@/lib/auth.server";

export const getRouter = () => {
  const handle401 = (data: any, queryOrMutation: any) => {
    if (data && typeof data === "object" && data.ok === false && data.status === 401) {
      const { refreshToken, setTokens, signOut } = useSessionStore.getState();
      if (!refreshToken) {
        signOut();
        return;
      }
      refreshTokensFn({ data: { refresh_token: refreshToken } })
        .then((res) => {
          if (res.ok && res.data) {
            setTokens({
              accessToken: res.data.access_token,
              refreshToken: res.data.refresh_token,
            });
            // Re-run the query or mutation to get actual data
            if (queryOrMutation?.fetch) {
              queryOrMutation.fetch(); // This retries the query in React Query
            } else if (queryOrMutation?.execute) {
               // Mutations are harder to retry automatically, but usually it's fine 
               // because the user can click the button again.
            }
          } else {
            signOut();
          }
        })
        .catch(() => signOut());
    }
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onSuccess: (data, query) => handle401(data, query),
    }),
    mutationCache: new MutationCache({
      onSuccess: (data, variables, context, mutation) => handle401(data, mutation),
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
