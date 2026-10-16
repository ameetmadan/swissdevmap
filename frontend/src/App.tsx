import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { parseLandingPath } from './lib/landing';
import { lazyWithReload } from './lib/lazyWithReload';

// Landing pages are plain content pages that never touch the map, so each side loads on its own.
const MapApp = lazyWithReload(() => import('./MapApp'));
const LandingPage = lazyWithReload(() => import('./components/LandingPage'));

// Landing pages are plain content pages; everything else is the map.
function AppInner() {
    const landing = parseLandingPath(useLocation().pathname);
    return (
        <Suspense fallback={null}>
            {landing ? <LandingPage {...landing} /> : <MapApp />}
        </Suspense>
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
