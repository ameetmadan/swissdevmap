import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ShareButton from './ShareButton';
import { companyTitle } from '../lib/pageMeta';
import { Company } from '../store/mapStore';

const CATEGORY_LABELS: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    cloud: 'Cloud',
    devops: 'DevOps',
};

interface CompanyDetail extends Company {
    created_at?: string;
}

export default function CompanyDetailModal({ companyId }: { companyId: string }) {
    const navigate = useNavigate();
    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const close = () => navigate({ pathname: '/', search: window.location.search });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        setCompany(null);

        axios.get(`/api/companies/${companyId}`)
            .then((res) => {
                if (!cancelled) setCompany(res.data);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.response?.status === 404
                    ? 'This company could not be found.'
                    : 'Failed to load company details.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(() => {
        if (company) document.title = companyTitle(company);
    }, [company]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tagsByCategory = (company?.tags || []).reduce<Record<string, string[]>>((acc, t) => {
        const cat = t.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t.tag);
        return acc;
    }, {});

    const modalContent = (
        <div className="detail-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="detail-panel" role="dialog" aria-modal="true" aria-label={company?.name || 'Company details'}>
                <button className="detail-close" onClick={close} aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {company && (
                    <ShareButton
                        surface="company"
                        className="detail-share"
                        getPayload={() => ({
                            url: `${window.location.origin}/company/${company.id}`,
                            title: companyTitle(company),
                            text: `${company.name}'s tech stack on SwissDevMap`,
                        })}
                    />
                )}

                {loading && (
                    <div className="detail-state">
                        <div className="spinner" />
                        <span>Loading company…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="detail-state">
                        <span className="detail-error-icon">⚠️</span>
                        <p>{error}</p>
                        <button className="btn-primary" onClick={close}>Back to map</button>
                    </div>
                )}

                {!loading && !error && company && (
                    <>
                        <div className="detail-header">
                            {company.type && <span className="detail-type-badge">{company.type}</span>}
                            <h2 className="detail-name">{company.name}</h2>
                            <div className="detail-meta">
                                <span className="detail-meta-item">📍 {company.city || 'Unknown location'}</span>
                                {company.uid && <span className="detail-meta-item detail-uid">{company.uid}</span>}
                            </div>
                        </div>

                        {company.website && (
                            <a
                                className="detail-website"
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                🔗 {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                        )}

                        <div className="detail-section">
                            <div className="section-label">Tech Stack</div>
                            {Object.keys(tagsByCategory).length === 0 && (
                                <div className="no-tags">No technologies recorded yet</div>
                            )}
                            {Object.entries(tagsByCategory).map(([cat, tags]) => (
                                <div key={cat} className="detail-tag-group">
                                    <div className="detail-tag-group-label">{CATEGORY_LABELS[cat] || cat}</div>
                                    <div className="tag-grid">
                                        {tags.map((tag) => (
                                            <span key={tag} className={`tag-chip cat-${cat} active`}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="detail-section detail-section--last">
                            <div className="section-label">Location</div>
                            <div className="detail-coords">{company.lat.toFixed(5)}, {company.lng.toFixed(5)}</div>
                        </div>
                    </>
                )}
            </div>

            <style>{`
        .detail-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 16px;
        }
        .detail-panel {
          position: relative;
          background: var(--bg-surface, #0d1521);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: var(--radius-md, 12px);
          padding: 24px;
          width: 100%;
          max-width: 440px;
          max-height: min(80vh, 640px);
          overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0,0,0,0.7);
          animation: detailIn 0.2s ease-out;
        }
        @keyframes detailIn {
          from { transform: scale(0.96) translateY(6px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .detail-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: var(--text-secondary, #8a9ab5);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm, 6px);
          display: flex;
          transition: color 0.15s, background 0.15s;
        }
        .detail-close:hover {
          color: var(--text-primary, #e8edf5);
          background: var(--bg-hover, rgba(255,255,255,0.05));
        }
        .detail-share {
          position: absolute;
          top: 16px;
          right: 52px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 28px;
          padding: 4px 10px;
          background: transparent;
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 20px;
          color: var(--text-secondary, #8a9ab5);
          font: 500 11px 'Inter', sans-serif;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }
        .detail-share:hover {
          color: var(--text-primary, #e8edf5);
          background: var(--bg-hover, rgba(255,255,255,0.05));
        }
        .detail-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px 8px;
          color: var(--text-secondary, #8a9ab5);
          font-size: 13px;
          text-align: center;
        }
        .detail-error-icon { font-size: 24px; }
        .detail-header { padding-right: 28px; margin-bottom: 16px; }
        .detail-share ~ .detail-header { padding-top: 28px; }
        .detail-type-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.35);
          border-radius: 20px;
          padding: 3px 10px;
          margin-bottom: 10px;
        }
        .detail-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #e8edf5);
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }
        .detail-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary, #8a9ab5);
        }
        .detail-uid {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-dim, #4a5568);
        }
        .detail-website {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--accent-blue, #3b82f6);
          text-decoration: none;
          margin-bottom: 20px;
          word-break: break-all;
        }
        .detail-website:hover { text-decoration: underline; }
        .detail-section {
          padding-top: 16px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.08));
          margin-top: 4px;
        }
        .detail-section--last { padding-bottom: 4px; }
        .detail-tag-group { margin-bottom: 12px; }
        .detail-tag-group:last-child { margin-bottom: 0; }
        .detail-tag-group-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-dim, #4a5568);
          margin-bottom: 6px;
        }
        .no-tags {
          font-size: 12px;
          color: var(--text-dim, #4a5568);
          font-style: italic;
        }
        .detail-coords {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-secondary, #8a9ab5);
        }
      `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
