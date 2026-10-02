import { useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAllCompanies } from '../hooks/useAllCompanies';
import { LandingLink, LandingModel, resolveLanding } from '../lib/landing';
import { SITE_NAME } from '../lib/pageMeta';

function RelatedLinks({ heading, items }: { heading: string; items: LandingLink[] }) {
    if (items.length === 0) return null;
    return (
        <section>
            <h2>{heading}</h2>
            <ul className="landing-links">
                {items.map((link) => (
                    <li key={link.path}><Link to={link.path}>{link.label}</Link> <span>{link.count}</span></li>
                ))}
            </ul>
        </section>
    );
}

/** Mirrors landingBodyHtml() in lib/landing.ts, which the edge function serves to crawlers. */
export function LandingContent({ model }: { model: LandingModel }) {
    return (
        <main className="landing">
            <p className="landing-brand"><Link to="/">{SITE_NAME}</Link></p>
            <h1>{model.h1}</h1>
            <p className="landing-intro">{model.intro}</p>
            <p><Link to={model.liveMapPath}>Open this view on the interactive map →</Link></p>
            <RelatedLinks heading="Related technologies" items={model.relatedTech} />
            <RelatedLinks heading={model.spec.city ? 'Nearby cities' : 'Where it is used'} items={model.relatedCities} />
            <section>
                <h2>Companies ({model.count})</h2>
                <ul className="landing-companies">
                    {model.companies.map((company) => (
                        <li key={company.path}><Link to={company.path}>{company.name}</Link> <span>{company.city ?? ''}</span></li>
                    ))}
                </ul>
            </section>
        </main>
    );
}

export default function LandingPage({ tagSlug, citySlug }: { tagSlug?: string; citySlug?: string }) {
    const companies = useAllCompanies();
    const resolution = useMemo(
        () => (companies ? resolveLanding(companies, { tagSlug, citySlug }) : null),
        [companies, tagSlug, citySlug],
    );

    useEffect(() => {
        if (resolution?.kind === 'page') document.title = resolution.model.title;
        else if (resolution?.kind === 'missing') document.title = `Not found | ${SITE_NAME}`;
    }, [resolution]);

    if (!resolution) {
        return <main className="landing"><p role="status">Loading…</p></main>;
    }
    if (resolution.kind === 'redirect') return <Navigate to={resolution.to} replace />;
    if (resolution.kind === 'missing') {
        return (
            <main className="landing">
                <h1>Page not found</h1>
                <p>We have no companies for that technology or city yet.</p>
                <p><Link to="/">Back to the map</Link></p>
            </main>
        );
    }
    return <LandingContent model={resolution.model} />;
}
