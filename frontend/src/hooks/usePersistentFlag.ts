import { useCallback, useState } from 'react';

/** A boolean remembered in localStorage. Storage can be blocked (private mode), so it degrades to per-visit. */
export function usePersistentFlag(key: string): [boolean, () => void] {
    const [value, setValue] = useState(() => {
        try {
            return window.localStorage.getItem(key) === '1';
        } catch {
            return false;
        }
    });

    const set = useCallback(() => {
        setValue(true);
        try {
            window.localStorage.setItem(key, '1');
        } catch {
            /* remembered for this visit only */
        }
    }, [key]);

    return [value, set];
}
