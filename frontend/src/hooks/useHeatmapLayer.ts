import { MutableRefObject, useEffect } from 'react';
import L from 'leaflet';
import axios from 'axios';

interface HeatmapResponse {
    features: Array<{
        geometry: { coordinates: [number, number] };
        properties: { intensity: number };
    }>;
}

/**
 * Shows the heat layer for `tech` while `active`. The effect owns the layer it adds: cleanup aborts the
 * request and removes that layer, so a response that arrives after the toggle was switched off or the
 * technology changed is dropped instead of being drawn on top.
 */
export function useHeatmapLayer(mapRef: MutableRefObject<L.Map | null>, active: boolean, tech: string) {
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !active) return;

        const controller = new AbortController();
        let layer: L.Layer | null = null;

        axios.get<HeatmapResponse>('/api/heatmap', { params: { tech }, signal: controller.signal })
            .then((res) => {
                if (controller.signal.aborted) return;
                const points = res.data.features.map((f) => [
                    f.geometry.coordinates[1], // lat
                    f.geometry.coordinates[0], // lng
                    Math.min(f.properties.intensity / 5, 1.0), // normalised intensity
                ] as [number, number, number]);

                // leaflet.heat attaches itself to L at runtime
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const heatFn = (L as unknown as any).heatLayer;
                if (typeof heatFn === 'function') {
                    layer = heatFn(points, {
                        radius: 60,
                        blur: 30,
                        maxZoom: 10,
                        gradient: { 0.2: '#172554', 0.4: '#1d4ed8', 0.6: '#fbbf24', 0.8: '#f97316', 1.0: '#dc2626' },
                    }).addTo(map);
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) console.error(error);
            });

        return () => {
            controller.abort();
            if (layer) map.removeLayer(layer);
        };
    }, [mapRef, active, tech]);
}
