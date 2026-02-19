import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { useMapStore } from './store/mapStore';

export default function App() {
    const { loading, companies, heatmapActive, heatmapTech, commuteCompanyIds } = useMapStore();

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <Sidebar />

            {/* Map area */}
            <div style={{ flex: 1, position: 'relative', height: '100vh', overflow: 'hidden' }}>
                {/* Top status bar */}
                <div className="map-topbar">
                    <div className="map-badge">
                        <span className="dot dot-blue" />
                        {companies.length} companies mapped
                    </div>
                    {heatmapActive && (
                        <div className="map-badge">
                            <span className="dot dot-amber" />
                            Heatmap: {heatmapTech}
                        </div>
                    )}
                    {commuteCompanyIds.length > 0 && (
                        <div className="map-badge">
                            <span className="dot dot-green" />
                            {commuteCompanyIds.length} in commute range
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

                <Map />
            </div>
        </div>
    );
}
