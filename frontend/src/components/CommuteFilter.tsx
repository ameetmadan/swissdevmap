import { useState } from 'react';
import axios from 'axios';
import { useMapStore } from '../store/mapStore';

export default function CommuteFilter() {
    const { commuteFrom, commuteMinutes, setCommuteFrom, setCommuteCompanyIds } = useMapStore();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [localCity, setLocalCity] = useState(commuteFrom);

    const handleFilter = async () => {
        if (!localCity.trim()) return;
        setLoading(true);
        setStatus(null);
        setCommuteFrom(localCity);

        try {
            const res = await axios.get('/api/commute', {
                params: { from: localCity, minutes: commuteMinutes },
            });
            const ids: string[] = res.data.companies.map((c: { id: string }) => c.id);
            setCommuteCompanyIds(ids);
            setStatus({
                type: 'success',
                msg: `${ids.length} companies within ${commuteMinutes} min from ${localCity}`,
            });
        } catch {
            setStatus({ type: 'error', msg: 'Could not reach SBB API — check connection' });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setCommuteCompanyIds([]);
        setLocalCity('');
        setCommuteFrom('');
        setStatus(null);
    };

    return (
        <div className="sidebar-section">
            <div className="section-label">🚆 Commute Filter (SBB)</div>
            <div className="commute-input-row">
                <input
                    id="commute-city-input"
                    className="commute-input"
                    placeholder="From city (e.g. Zürich)"
                    value={localCity}
                    onChange={(e) => setLocalCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Max</span>
                <select
                    className="tech-select"
                    style={{ marginTop: 0, flex: 1 }}
                    value={commuteMinutes}
                    onChange={(e) => useMapStore.getState().setCommuteMinutes(Number(e.target.value))}
                    id="commute-minutes-select"
                >
                    {[15, 20, 30, 45, 60].map((m) => (
                        <option key={m} value={m}>{m} min</option>
                    ))}
                </select>
                <button
                    id="commute-filter-btn"
                    className="btn-primary"
                    onClick={handleFilter}
                    disabled={loading || !localCity.trim()}
                >
                    {loading ? '⏳' : 'Filter'}
                </button>
                {status && (
                    <button className="btn-ghost" onClick={handleClear} id="commute-clear-btn">Clear</button>
                )}
            </div>
            {status && (
                <div className={`commute-status ${status.type === 'success' ? 'success' : ''}`}>
                    {status.msg}
                </div>
            )}
        </div>
    );
}
