import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { useMapStore, Company } from '../store/mapStore';

// Fix Leaflet default marker icon path broken by bundlers (use CDN URLs)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_COLORS: Record<string, string> = {
    frontend: '#3b82f6',
    backend: '#10b981',
    cloud: '#f59e0b',
    devops: '#8b5cf6',
};

function escapeHtml(value: string | null | undefined): string {
    return (value ?? '').replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return entities[character];
    });
}

function getDominantCategory(tags: Company['tags']): string {
    if (!tags || tags.length === 0) return 'backend';
    const counts: Record<string, number> = {};
    for (const { category } of tags) counts[category] = (counts[category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function makeCircleIcon(color: string, isCommute: boolean, isSelected: boolean) {
    const ringColor = isSelected ? '#ffffff' : isCommute ? '#06b6d4' : 'rgba(255,255,255,0.3)';
    const ringWidth = isSelected ? 4 : isCommute ? 3 : 1;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="10" fill="${color}" fill-opacity="0.9" stroke="${ringColor}" stroke-width="${ringWidth}"/>
  </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
    });
}

// Leaflet.heat types shim
declare global {
    interface Window { L: typeof L; }
}

export default function Map() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const companyMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
    const heatLayer = useRef<L.Layer | null>(null);
    const navigate = useNavigate();

    const {
        companies, heatmapActive, heatmapTech, commuteCompanyIds, commuteFrom,
        setCompanies, setLoading,
        selectedTags, selectedTypes,
        selectedCompanyId,
    } = useMapStore();

    // Fetch companies whenever selectedTags or selectedTypes change
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        const params = new URLSearchParams();
        selectedTags.forEach(t => params.append('tag', t));
        selectedTypes.forEach(t => params.append('type', t));
        axios.get('/api/companies', { params, signal: controller.signal })
            .then((res) => setCompanies(res.data))
            .catch((error) => {
                if (!controller.signal.aborted) console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [selectedTags, selectedTypes, setCompanies, setLoading]);

    // Init Leaflet map once
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
            center: [46.80, 8.23],
            zoom: 8,
            zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstance.current = map;
        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    // Render company markers whenever companies or commute filter changes
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        companyMarkersRef.current.clear();

        for (const company of companies) {
            // Apply commute filter: if active, hide companies not in range
            if (commuteFrom && !commuteCompanyIds.includes(company.id)) {
                continue;
            }

            const isCommute = commuteCompanyIds.includes(company.id);
            const color = CATEGORY_COLORS[getDominantCategory(company.tags)] || '#3b82f6';
            const icon = makeCircleIcon(color, isCommute, company.id === selectedCompanyId);

            const tagHtml = company.tags
                .slice(0, 8)
                .map((t) =>
                    `<span style="display:inline-block;padding:2px 8px;margin:2px;border-radius:20px;font-size:10px;font-weight:500;
                        background:${CATEGORY_COLORS[t.category] || '#4a5568'}33;
                        color:${CATEGORY_COLORS[t.category] || '#8a9ab5'};
                        border:1px solid ${CATEGORY_COLORS[t.category] || '#4a5568'}55">${escapeHtml(t.tag)}</span>`
                ).join('');

            const marker = L.marker([company.lat, company.lng], { icon })
                .bindPopup(
                    `<div style="font-family:Inter,sans-serif;min-width:200px">
            <div style="font-size:14px;font-weight:700;color:#e8edf5;margin-bottom:2px">${escapeHtml(company.name)}</div>
            <div style="font-size:12px;color:#8a9ab5;margin-bottom:10px">📍 ${escapeHtml(company.city)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:10px">${tagHtml}</div>
            <button class="sdm-popup-details-btn" style="width:100%;padding:7px 10px;background:rgba(59,130,246,0.12);
              border:1px solid rgba(59,130,246,0.4);color:#93c5fd;border-radius:6px;font-size:12px;
              font-weight:600;font-family:Inter,sans-serif;cursor:pointer">View full profile →</button>
          </div>`,
                    {
                        className: 'sdm-popup',
                        maxWidth: 280,
                    }
                )
                .on('popupopen', (e) => {
                    const el = e.popup.getElement();
                    const btn = el?.querySelector('.sdm-popup-details-btn');
                    btn?.addEventListener('click', () => navigate({ pathname: `/company/${company.id}`, search: window.location.search }));
                });

            marker.addTo(map);
            markersRef.current.push(marker);
            companyMarkersRef.current.set(company.id, marker);
        }
    }, [companies, commuteCompanyIds, commuteFrom, navigate, selectedCompanyId]);

    useEffect(() => {
        if (!selectedCompanyId) return;
        const marker = companyMarkersRef.current.get(selectedCompanyId);
        const map = mapInstance.current;
        if (!marker || !map) return;
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 11), { animate: true });
        marker.openPopup();
    }, [selectedCompanyId, companies, commuteCompanyIds, commuteFrom]);

    // Heatmap layer (leaflet.heat)
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Remove existing heat layer
        if (heatLayer.current) {
            map.removeLayer(heatLayer.current);
            heatLayer.current = null;
        }

        if (!heatmapActive) return;

        axios.get(`/api/heatmap?tech=${encodeURIComponent(heatmapTech)}`)
            .then((res) => {
                const features = res.data.features as Array<{
                    geometry: { coordinates: [number, number] };
                    properties: { intensity: number };
                }>;

                const points = features.map((f) => [
                    f.geometry.coordinates[1], // lat
                    f.geometry.coordinates[0], // lng
                    Math.min(f.properties.intensity / 5, 1.0), // normalised intensity
                ] as [number, number, number]);

                // leaflet.heat attaches itself to L at runtime
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const heatFn = (L as unknown as any).heatLayer;
                if (typeof heatFn === 'function') {
                    heatLayer.current = heatFn(points, {
                        radius: 60,
                        blur: 30,
                        maxZoom: 10,
                        gradient: { 0.2: '#172554', 0.4: '#1d4ed8', 0.6: '#fbbf24', 0.8: '#f97316', 1.0: '#dc2626' },
                    }).addTo(map);
                }
            })
            .catch(console.error);
    }, [heatmapActive, heatmapTech]);

    return (
        <>
            <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
            <style>{`
        .sdm-popup .leaflet-popup-content-wrapper {
          background: #0d1521;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.6);
          color: #e8edf5;
        }
        .sdm-popup .leaflet-popup-tip {
          background: #0d1521;
        }
        .sdm-popup .leaflet-popup-close-button {
          color: #8a9ab5 !important;
        }
        .leaflet-container {
          background: #080c14;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
        </>
    );
}
