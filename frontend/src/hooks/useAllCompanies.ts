import { useEffect } from 'react';
import axios from 'axios';
import { useMapStore } from '../store/mapStore';

/** The unfiltered company list, fetched once and shared through the store. null while loading. */
export function useAllCompanies() {
    const allCompanies = useMapStore((state) => state.allCompanies);
    const setAllCompanies = useMapStore((state) => state.setAllCompanies);

    useEffect(() => {
        if (allCompanies) return;
        const controller = new AbortController();
        axios.get('/api/companies', { signal: controller.signal })
            .then((res) => setAllCompanies(res.data))
            .catch(() => { /* callers stay in their loading state */ });
        return () => controller.abort();
    }, [allCompanies, setAllCompanies]);

    return allCompanies;
}
