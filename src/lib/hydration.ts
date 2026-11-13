'use client';

import { useEffect, useState } from 'react';

/** Prevents server/client markup differences when content comes from localStorage. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Deliberate one-way mount gate: server HTML must match the first client render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  return hydrated;
}
