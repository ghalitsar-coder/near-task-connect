import { logoutFn } from "@/lib/auth/functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Full-page redirect to Auth.js OAuth provider */
type CsrfResponse = {
    csrfToken: string;
  };
  
  async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf", {
      credentials: "include",
    });
  
    if (!response.ok) {
      throw new Error("Unable to start OAuth sign-in");
    }
  
    const data = (await response.json()) as CsrfResponse;
    if (!data.csrfToken) {
      throw new Error("Unable to start OAuth sign-in");
    }
  
    return data.csrfToken;
  }

  export function useLogout() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => logoutFn(),
      onSuccess: () => {
        qc.setQueryData(["auth", "session"], null);
      },
    });
  }
  
export async function startOAuth(provider: "google" | "github") {
    if (typeof window === "undefined") return;
  
    const csrfToken = await getCsrfToken();
    const callbackUrl = `${window.location.origin}/`;
  
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/api/auth/signin/${provider}`;
    form.style.display = "none";
  
    const inputs = [
      ["csrfToken", csrfToken],
      ["callbackUrl", callbackUrl],
    ] as const;
  
    for (const [name, value] of inputs) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
  
    document.body.appendChild(form);
    form.submit();
  }
  