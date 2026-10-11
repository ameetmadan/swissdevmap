import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useMapStore } from '../store/mapStore';

/**
 * The unfiltered company list, fetched once and shared through the store. `companies` is null until it
 * arrives; `failed` says the request failed (not that it is slow) and `retry` tries again.
 */
export function useAllCompanies() {
    const companies = useMapStore((state) => state.allCompanies);
    const setAllCompanies = useMapStore((state) => state.setAllCompanies);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (companies) return;
        const controller = new AbortController();
        setFailed(false);
        axios.get('/api/companies', { signal: controller.signal })
            .then((res) => setAllCompanies(res.data))
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true);
            });
        return () => controller.abort();
    }, [companies, attempt, setAllCompanies]);

    const retry = useCallback(() => setAttempt((count) => count + 1), []);
    return { companies, failed, retry };
}
