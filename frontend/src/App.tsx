import { useState } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { useMapStore } from './store/mapStore';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
    const { loading, companies, heatmapActive, heatmapTech, commuteCompanyIds } = useMapStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-shell">
            {/* Map fills 100% of the screen always */}
            <Map />

            {/* Topbar badges — always visible over the map */}
            <div className="map-topbar">
                <div className="map-badge">
                    <span className="dot dot-blue" />
                    {companies.length} companies
                </div>
                {heatmapActive && (
                    <div className="map-badge">
                        <span className="dot dot-amber" />
                        <span className="badge-text-hide">Heatmap: </span>{heatmapTech}
                    </div>
                )}
                {commuteCompanyIds.length > 0 && (
                    <div className="map-badge">
                        <span className="dot dot-green" />
                        {commuteCompanyIds.length}
                        <span className="badge-text-hide"> in commute</span>
                    </div>
                )}
            </div>

            {/* Loading overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner" />
                    Loading tech data…
                </div>
            )}

            {/* Sidebar: fixed overlay on desktop, bottom sheet on mobile */}
            <Sidebar
                isOpen={sidebarOpen}
                onOpen={() => setSidebarOpen(true)}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Backdrop — tapping outside closes the sheet on mobile */}
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Vercel Analytics */}
            <Analytics />
        </div>
    );
}
