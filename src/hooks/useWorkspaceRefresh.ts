import { useEffect, useState } from 'react';
import { onWorkspaceChange, onWorkspaceResync } from '../services/realtime';

/** Returns a revision that active data views can include in their fetch effect dependencies. */
export function useWorkspaceRefresh(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const changed = onWorkspaceChange(() => setRevision((value) => value + 1));
    const resynced = onWorkspaceResync(() => setRevision((value) => value + 1));
    return () => {
      changed();
      resynced();
    };
  }, []);
  return revision;
}
