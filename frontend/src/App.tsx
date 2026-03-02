import { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { useMapStore } from './store/mapStore';
import { Analytics } from '@vercel/analytics/react';

const COMMUTE_MESSAGES = [
    'Fetching commute data…',
    'Querying SBB API for each city, this takes a moment…',
    'Still working, almost there…',
    'This is taking longer than expected, please wait…',
];

export default function App() {
    const {
        loading, companies, heatmapActive, heatmapTech,
        commuteCompanyIds, commuteLoading, commute429, setCommute429,
    } = useMapStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [commuteMsgIdx, setCommuteMsgIdx] = useState(0);

    useEffect(() => {
        if (!commuteLoading) {
            setCommuteMsgIdx(0);
            return;
        }
        const interval = setInterval(() => {
            setCommuteMsgIdx((prev) => (prev + 1) % COMMUTE_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [commuteLoading]);

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

            {/* Commute loading — dark overlay on map + fixed indicator above everything */}
            {commuteLoading && (
                <>
                    <div className="commute-map-overlay" />
                    <div className="commute-loading-indicator">
                        <div className="spinner" />
                        <span key={commuteMsgIdx} className="commute-overlay-msg">
                            {COMMUTE_MESSAGES[commuteMsgIdx]}
                        </span>
                    </div>
                </>
            )}

            {/* 429 rate-limit toast */}
            {commute429 && (
                <div className="commute-toast">
                    <span>The commute API is currently rate-limited — please try again in a few minutes.</span>
                    <button onClick={() => setCommute429(false)} aria-label="Dismiss">✕</button>
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
