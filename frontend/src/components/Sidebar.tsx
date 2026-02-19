import { useState } from 'react';
import { useMapStore } from '../store/mapStore';
import CommuteFilter from './CommuteFilter';
import CompanyForm from './CompanyForm';

const TAGS_BY_CATEGORY: Array<{ category: string; label: string; tags: string[] }> = [
    {
        category: 'frontend',
        label: 'Frontend',
        tags: ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'TypeScript'],
    },
    {
        category: 'backend',
        label: 'Backend',
        tags: ['Node.js', 'Java', 'Python', 'Go', 'Rust', 'Scala', 'C#', 'C++', 'Kotlin', 'PostgreSQL'],
    },
    {
        category: 'cloud',
        label: 'Cloud',
        tags: ['AWS', 'Azure', 'GCP'],
    },
    {
        category: 'devops',
        label: 'DevOps',
        tags: ['Kubernetes', 'Docker', 'Terraform', 'Kafka'],
    },
];

const CLOUD_OPTIONS = [
    { id: 'AWS', label: 'AWS', cls: 'aws' },
    { id: 'Azure', label: 'Azure', cls: 'azure' },
    { id: 'GCP', label: 'GCP', cls: 'gcp' },
];

interface SidebarProps {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onOpen, onClose }: SidebarProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const {
        companies, selectedTags, selectedTypes, heatmapActive, heatmapTech,
        toggleTag, toggleType, setHeatmapActive, setHeatmapTech,
    } = useMapStore();

    const tagCount = [...new Set(companies.flatMap((c) => c.tags.map((t) => t.tag)))].length;
    const cityCount = [...new Set(companies.map((c) => c.city))].length;

    return (
        <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>

            {/* ── Mobile peek bar ────────────────────────────────────────── */}
            {/* Always visible at the bottom on mobile; tap to expand */}
            <div
                className="sidebar-peek"
                onClick={() => isOpen ? onClose() : onOpen()}
                role="button"
                aria-label={isOpen ? 'Collapse filters' : 'Expand filters'}
            >
                <div className="sidebar-handle" />
                <div className="sidebar-peek-content">
                    <div className="sidebar-peek-left">
                        <span className="sidebar-peek-icon">🗺️</span>
                        <span className="sidebar-peek-label">SwissDevMap</span>
                        {selectedTags.length > 0 && (
                            <span className="sidebar-peek-badge">{selectedTags.length} filters</span>
                        )}
                    </div>
                    <svg
                        className={`sidebar-peek-chevron${isOpen ? ' sidebar-peek-chevron--open' : ''}`}
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="18 15 12 9 6 15" />
                    </svg>
                </div>
            </div>

            {/* ── Sidebar content (scrolls) ────────────────────────────── */}
            <div className="sidebar-content">
                {/* Header */}
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">🗺️</div>
                        <div style={{ flex: 1 }}>
                            <div className="logo-text">SwissDevMap</div>
                            <div className="logo-sub">Tech Ecosystem Explorer</div>
                        </div>
                        <button
                            className="sidebar-close-btn"
                            onClick={onClose}
                            aria-label="Close sidebar"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="sidebar-section">
                    <div className="section-label">Overview</div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{companies.length}</div>
                            <div className="stat-label">Companies</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{tagCount}</div>
                            <div className="stat-label">Tech Tags</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{cityCount}</div>
                            <div className="stat-label">Cities</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{selectedTags.length}</div>
                            <div className="stat-label">Active Filters</div>
                        </div>
                    </div>
                </div>

                {/* Commute Filter */}
                <CommuteFilter />

                {/* Heatmap */}
                <div className="sidebar-section">
                    <div className="section-label">Heatmap</div>
                    <div className="heatmap-row">
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Show tech density
                        </span>
                        <label className="toggle-switch" id="heatmap-toggle">
                            <input
                                type="checkbox"
                                checked={heatmapActive}
                                onChange={(e) => setHeatmapActive(e.target.checked)}
                            />
                            <div className="toggle-track" />
                            <div className="toggle-thumb" />
                        </label>
                    </div>
                    <select
                        className="tech-select"
                        value={heatmapTech}
                        onChange={(e) => setHeatmapTech(e.target.value)}
                        id="heatmap-tech-select"
                    >
                        <optgroup label="Frontend">
                            {['React', 'Vue', 'Angular', 'Next.js', 'TypeScript'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Backend">
                            {['Java', 'Python', 'Go', 'Rust', 'Node.js', 'Scala', 'C#'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Cloud">
                            {['AWS', 'Azure', 'GCP'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </optgroup>
                    </select>

                    <div style={{ marginTop: 12 }}>
                        <div className="section-label" style={{ marginBottom: 8 }}>Cloud density</div>
                        <div className="cloud-grid">
                            {CLOUD_OPTIONS.map(({ id, label, cls }) => (
                                <button
                                    key={id}
                                    id={`cloud-btn-${id.toLowerCase()}`}
                                    className={`cloud-btn ${cls} ${heatmapTech === id && heatmapActive ? 'active' : ''}`}
                                    onClick={() => {
                                        setHeatmapTech(id);
                                        setHeatmapActive(true);
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Company Type filters */}
                <div className="sidebar-section">
                    <div className="section-label">Company Type</div>
                    <div className="tag-grid">
                        {['Enterprise', 'Fintech', 'Consulting', 'E-Commerce', 'Industrial'].map((type) => (
                            <button
                                key={type}
                                className={`tag-chip ${selectedTypes.includes(type) ? 'active' : ''}`}
                                onClick={() => toggleType(type)}
                                style={{
                                    backgroundColor: selectedTypes.includes(type) ? '#2563eb' : 'rgba(255,255,255,0.05)',
                                    color: selectedTypes.includes(type) ? 'white' : '#94a3b8',
                                    border: `1px solid ${selectedTypes.includes(type) ? '#2563eb' : 'rgba(255,255,255,0.1)'}`
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tech stack filters */}
                {TAGS_BY_CATEGORY.map(({ category, label, tags }) => (
                    <div key={category} className="sidebar-section">
                        <div className="section-label">{label}</div>
                        <div className="tag-grid">
                            {tags.map((tag) => (
                                <button
                                    key={tag}
                                    id={`tag-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                    className={`tag-chip cat-${category} ${selectedTags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Legend */}
                <div className="sidebar-section">
                    <div className="section-label">Legend</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                            { color: '#3b82f6', label: 'Frontend-dominant' },
                            { color: '#10b981', label: 'Backend-dominant' },
                            { color: '#f59e0b', label: 'Cloud-dominant' },
                            { color: '#8b5cf6', label: 'DevOps-dominant' },
                        ].map(({ color, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: '2px solid #06b6d4', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Within commute radius</span>
                        </div>
                    </div>
                </div>

                {/* Add Company */}
                <div className="sidebar-section sidebar-add-desktop">
                    <button
                        onClick={() => setIsFormOpen(true)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px dashed #3b82f6',
                            color: '#3b82f6',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: 13
                        }}
                    >
                        + Add Missing Company
                    </button>
                </div>
            </div>

            {/* ── Sticky footer: Show results CTA (mobile) ──────────────── */}
            <div className="sidebar-footer">
                <button
                    className="btn-add-company"
                    onClick={() => setIsFormOpen(true)}
                >
                    + Add
                </button>
                <button
                    className="btn-show-results"
                    onClick={onClose}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Show {companies.length} companies on map
                </button>
            </div>

            {isFormOpen && <CompanyForm onClose={() => setIsFormOpen(false)} />}
        </aside>
    );
}
