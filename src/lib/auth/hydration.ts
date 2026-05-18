import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/useSessionStore";

/** True after zustand persist has rehydrated from localStorage. */
export function useSessionHydrated() {
  const [hydrated, setHydrated] = useState(() => useSessionStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useSessionStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}
