import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

interface Stats {
    companies: number;
    cities: number;
    technologies: number;
    last_updated: string | null;
}

const ISSUES_URL = 'https://github.com/ameetmadan/swissdevmap/issues/new?title=Data%20correction%3A%20';

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CH', { year: 'numeric', month: 'long', day: 'numeric' });

export default function AboutDialog({ onClose }: { onClose: () => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        axios.get('/api/stats', { signal: controller.signal })
            .then((res) => setStats(res.data))
            .catch(() => { /* the sources text still reads fine without the numbers */ });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            opener?.focus();
        };
    }, [onClose]);

    return createPortal(
        <div className="dialog-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
                <button ref={closeRef} type="button" className="dialog-close" onClick={onClose} aria-label="Close">×</button>
                <h2 id="about-title">About this data</h2>

                {stats && (
                    <p className="about-stats">
                        {stats.companies} companies in {stats.cities} cities, {stats.technologies} technologies.
                        {stats.last_updated && <> Last updated {formatDate(stats.last_updated)}.</>}
                    </p>
                )}

                <h3>Where it comes from</h3>
                <ul>
                    <li><strong>Companies</strong> come from a curated list of Swiss tech employers, plus companies visitors add with “Add Missing Company”.</li>
                    <li><strong>Technologies</strong> are found by scanning public job postings on jobs.ch for technology keywords, plus tags visitors submit.</li>
                    <li><strong>Commute times</strong> are fetched live from the SBB public transport API.</li>
                </ul>

                <h3>Worth knowing</h3>
                <p>
                    Tags reflect what companies hire for, not a complete inventory of their stack, so a missing
                    technology doesn’t mean it isn’t used.
                </p>

                <h3>Spot a mistake?</h3>
                <p>
                    Add a missing company from the sidebar, or{' '}
                    <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">report a correction on GitHub</a>.
                </p>
            </div>
        </div>,
        document.body,
    );
}
