import { useEffect, useState } from 'react';
import axios from 'axios';
import { COMMUTE_MINUTE_OPTIONS } from '../lib/filterOptions';
import { useMapStore } from '../store/mapStore';

export default function CommuteFilter() {
    const {
        commuteFrom, commuteAppliedMinutes, commuteMinutes, commuteLoading,
        applyCommute, clearCommute, setCommuteMinutes,
        setCommuteCompanyIds, setCommuteLoading, setCommute429,
    } = useMapStore();
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [localCity, setLocalCity] = useState(commuteFrom);

    // Follows the applied origin so URL-driven changes (Back, shared link) show up in the input.
    useEffect(() => setLocalCity(commuteFrom), [commuteFrom]);

    // The applied origin and duration drive the request, whether they came from the Filter button
    // or from the URL. The sidebar always mounts this component, so a shared link runs it once.
    useEffect(() => {
        if (!commuteFrom) {
            setCommuteLoading(false);
            setStatus(null);
            return;
        }
        const controller = new AbortController();
        setCommuteLoading(true);
        setCommute429(false);
        setStatus(null);

        axios.get('/api/commute', {
            params: { from: commuteFrom, minutes: commuteAppliedMinutes },
            signal: controller.signal,
        })
            .then((res) => {
                const ids: string[] = res.data.companies.map((c: { id: string }) => c.id);
                setCommuteCompanyIds(ids);
                setStatus({
                    type: 'success',
                    msg: `${ids.length} companies within ${commuteAppliedMinutes} min from ${commuteFrom}`,
                });
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                if (axios.isAxiosError(err) && err.response?.status === 429) {
                    setCommute429(true);
                } else {
                    setStatus({ type: 'error', msg: 'Could not reach SBB API — check connection' });
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setCommuteLoading(false);
            });

        return () => controller.abort();
    }, [commuteFrom, commuteAppliedMinutes, setCommuteCompanyIds, setCommuteLoading, setCommute429]);

    const handleFilter = () => {
        if (!localCity.trim()) return;
        applyCommute(localCity, commuteMinutes);
    };

    return (
        <div className="sidebar-section">
            <div className="section-label">🚆 Commute Filter (SBB)</div>
            <div className="commute-input-row">
                <input
                    id="commute-city-input"
                    className="commute-input"
                    aria-label="Commute starting city"
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
                    onChange={(e) => setCommuteMinutes(Number(e.target.value))}
                    id="commute-minutes-select"
                >
                    {COMMUTE_MINUTE_OPTIONS.map((m) => (
                        <option key={m} value={m}>{m} min</option>
                    ))}
                </select>
                <button
                    id="commute-filter-btn"
                    className="btn-primary"
                    onClick={handleFilter}
                    disabled={commuteLoading || !localCity.trim()}
                >
                    {commuteLoading ? '⏳' : 'Filter'}
                </button>
                {commuteFrom && (
                    <button className="btn-ghost" onClick={clearCommute} id="commute-clear-btn">Clear</button>
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
