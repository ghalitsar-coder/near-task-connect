/**
 * SPA Entry Point for Minikube/Local Dev
 * 
 * TanStack Start uses hydrateRoot(document, ...) which requires SSR.
 * For local Minikube deployment (no Cloudflare Workers), we use createRoot instead.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { getRouter } from "./router";

import "./styles.css";

const router = getRouter();
const queryClient = (router as any).options.context.queryClient;

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
