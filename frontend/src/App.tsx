import { useState, useEffect } from 'react';
import { useMatch } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import CompanyDetailModal from './components/CompanyDetailModal';
import SearchBox from './components/SearchBox';
import ShareButton from './components/ShareButton';
import { usePageTitle } from './hooks/usePageTitle';
import { viewTitle } from './lib/pageMeta';
import { viewKey } from './lib/viewUrl';
import { useViewUrlSync } from './hooks/useViewUrlSync';
import { selectView, useMapStore } from './store/mapStore';
import { Analytics } from '@vercel/analytics/react';

const COMMUTE_MESSAGES = [
    'Fetching commute data…',
    'Querying SBB API for each city, this takes a moment…',
    'Still working, almost there…',
    'This is taking longer than expected, please wait…',
];

function AppInner() {
    const {
        loading, companies, heatmapActive, heatmapTech,
        commuteCompanyIds, commuteLoading, commute429, setCommute429,
        selectedTags, selectedTypes, toggleTag, toggleType, clearFilters,
    } = useMapStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [commuteMsgIdx, setCommuteMsgIdx] = useState(0);
    const companyRouteMatch = useMatch('/company/:id');
    const hasView = useMapStore((state) => viewKey(selectView(state)) !== '');
    useViewUrlSync();
    usePageTitle();

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
                <SearchBox />
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
                {hasView && (
                    <ShareButton
                        surface="view"
                        className="share-button"
                        getPayload={() => {
                            const view = selectView(useMapStore.getState());
                            const title = viewTitle(view);
                            return { url: `${window.location.origin}/${viewKey(view)}`, title, text: title };
                        }}
                    >
                        Share view
                    </ShareButton>
                )}
                {(selectedTags.length > 0 || selectedTypes.length > 0) && (
                    <div className="active-filters" role="group" aria-label="Active filters">
                        <div className="active-filter-chips">
                            {selectedTags.map((tag) => (
                                <button
                                    className="active-filter-chip"
                                    key={`technology-${tag}`}
                                    onClick={() => toggleTag(tag)}
                                    aria-label={`Remove technology filter ${tag}`}
                                >
                                    <span>Technology: {tag}</span><span aria-hidden="true">×</span>
                                </button>
                            ))}
                            {selectedTypes.map((type) => (
                                <button
                                    className="active-filter-chip"
                                    key={`company-type-${type}`}
                                    onClick={() => toggleType(type)}
                                    aria-label={`Remove company type filter ${type}`}
                                >
                                    <span>Company type: {type}</span><span aria-hidden="true">×</span>
                                </button>
                            ))}
                        </div>
                        <button className="clear-filters-button" onClick={clearFilters}>
                            Clear all
                        </button>
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
                <button
                    type="button"
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close map filters"
                />
            )}

            {/* Company detail modal — driven by the /company/:id route, rendered over the map */}
            {companyRouteMatch?.params.id && (
                <CompanyDetailModal companyRef={companyRouteMatch.params.id} />
            )}

            {/* Vercel Analytics */}
            <Analytics />
        </div>
    );
}

export default Sentry.withErrorBoundary(AppInner, {
    fallback: (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>The error has been reported. Please refresh the page.</p>
        </div>
    ),
});
