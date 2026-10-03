import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyView, parseView, viewKey } from '../lib/viewUrl';
import { selectView, useMapStore } from '../store/mapStore';

// Keeps the query string and the store in step. Store changes replace the URL entry (so a chip
// toggle never adds history); Back/Forward and pasted URLs flow the other way into the store.
// Each side only writes when the other disagrees, which is what stops the two effects looping.
export function useViewUrlSync() {
    const { search } = useLocation();
    const navigate = useNavigate();
    const selectedTags = useMapStore((s) => s.selectedTags);
    const selectedTypes = useMapStore((s) => s.selectedTypes);
    const heatmapActive = useMapStore((s) => s.heatmapActive);
    const heatmapTech = useMapStore((s) => s.heatmapTech);
    const commuteFrom = useMapStore((s) => s.commuteFrom);
    const commuteAppliedMinutes = useMapStore((s) => s.commuteAppliedMinutes);
    const setView = useMapStore((s) => s.setView);

    useEffect(() => {
        const next = applyView(search, selectView(useMapStore.getState()));
        if (next !== search) navigate({ search: next }, { replace: true });
        // `search` is deliberately absent: URL-driven changes are handled by the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTags, selectedTypes, heatmapActive, heatmapTech, commuteFrom, commuteAppliedMinutes, navigate]);

    useEffect(() => {
        const fromUrl = parseView(search);
        if (viewKey(fromUrl) !== viewKey(selectView(useMapStore.getState()))) setView(fromUrl);
    }, [search, setView]);
}
