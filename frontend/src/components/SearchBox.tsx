import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CompanyForm from './CompanyForm';
import { companyPath } from '../lib/paths';
import { buildIndex, search, SearchOption } from '../lib/search';
import { applyView, EMPTY_VIEW } from '../lib/viewUrl';
import { useMapStore } from '../store/mapStore';

const GROUP_LABELS: Record<SearchOption['kind'], string> = {
    company: 'Companies',
    technology: 'Technologies',
    city: 'Cities',
};
const KIND_NOUN: Record<SearchOption['kind'], string> = {
    company: 'company',
    technology: 'technology',
    city: 'city',
};
const CITY_ZOOM = 12;

function isTypingTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return !!element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
}

export default function SearchBox() {
    const navigate = useNavigate();
    const listId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [formName, setFormName] = useState<string | null>(null);
    const allCompanies = useMapStore((state) => state.allCompanies);
    const setAllCompanies = useMapStore((state) => state.setAllCompanies);

    useEffect(() => {
        if (allCompanies) return;
        const controller = new AbortController();
        axios.get('/api/companies', { signal: controller.signal })
            .then((res) => setAllCompanies(res.data))
            .catch(() => { /* search simply stays in its loading state */ });
        return () => controller.abort();
    }, [allCompanies, setAllCompanies]);

    const index = useMemo(() => (allCompanies ? buildIndex(allCompanies) : null), [allCompanies]);
    const options = useMemo(() => (index ? search(index, query) : []), [index, query]);
    const trimmed = query.trim();
    const showPopup = open && trimmed.length > 0;
    const showList = showPopup && options.length > 0;

    useEffect(() => {
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            const isPalette = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
            const isSlash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey
                && !isTypingTarget(event.target);
            if (!isPalette && !isSlash) return;
            event.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.select();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const choose = (option: SearchOption) => {
        const state = useMapStore.getState();
        if (option.kind === 'company') {
            // A company hidden by the current filters has no marker to fly to, so drop the filters first.
            const visible = state.companies.some((c) => c.id === option.id)
                && (!state.commuteFrom || state.commuteCompanyIds.includes(option.id));
            let nextSearch = window.location.search;
            if (!visible) {
                state.clearFilters();
                state.clearCommute();
                nextSearch = applyView(nextSearch, {
                    ...EMPTY_VIEW,
                    heatmapTech: state.heatmapActive ? state.heatmapTech : null,
                });
            }
            state.setSelectedCompanyId(option.id);
            navigate({ pathname: companyPath(option), search: nextSearch });
        } else if (option.kind === 'technology') {
            if (!state.selectedTags.includes(option.tag)) state.toggleTag(option.tag);
        } else {
            state.focusMap({ lat: option.lat, lng: option.lng, zoom: CITY_ZOOM });
        }
        setQuery('');
        setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!options.length) return;
            event.preventDefault();
            setOpen(true);
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex((current) => (current + step + options.length) % options.length);
        } else if (event.key === 'Enter' && showList) {
            event.preventDefault();
            choose(options[activeIndex]);
        } else if (event.key === 'Escape') {
            if (open) setOpen(false);
            else setQuery('');
        }
    };

    const optionId = (position: number) => `${listId}-option-${position}`;

    return (
        <div className="map-search">
            <input
                ref={inputRef}
                type="text"
                className="map-search-input"
                role="combobox"
                aria-label="Search companies, technologies and cities"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={listId}
                aria-activedescendant={showList ? optionId(activeIndex) : undefined}
                aria-keyshortcuts="/ Control+K Meta+K"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search companies, tech or city…"
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={handleKeyDown}
            />

            {showPopup && (
                // Keeps focus in the input while clicking results, so the blur handler doesn't close the popup first.
                <div className="map-search-popup" onMouseDown={(event) => event.preventDefault()}>
                    {showList && (
                        <ul id={listId} role="listbox" aria-label="Search results" className="map-search-list">
                            {options.map((option, position) => (
                                <li key={`${option.kind}-${option.label}-${position}`} role="presentation">
                                    {(position === 0 || options[position - 1].kind !== option.kind) && (
                                        <div className="map-search-group" aria-hidden="true">{GROUP_LABELS[option.kind]}</div>
                                    )}
                                    <div
                                        id={optionId(position)}
                                        role="option"
                                        aria-selected={position === activeIndex}
                                        aria-label={`${option.label}, ${KIND_NOUN[option.kind]}, ${option.detail}`}
                                        className={`map-search-option${position === activeIndex ? ' map-search-option--active' : ''}`}
                                        onMouseEnter={() => setActiveIndex(position)}
                                        onClick={() => choose(option)}
                                    >
                                        <span className="map-search-label">{option.label}</span>
                                        <span className="map-search-detail">{option.detail}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!showList && !index && <div className="map-search-empty" role="status">Loading companies…</div>}
                    {!showList && index && (
                        <div className="map-search-empty" role="status">
                            <span>No match for “{trimmed}”.</span>
                            <button
                                type="button"
                                className="map-search-add"
                                onClick={() => {
                                    setFormName(trimmed);
                                    setOpen(false);
                                }}
                            >
                                Add “{trimmed}” to SwissDevMap
                            </button>
                        </div>
                    )}
                </div>
            )}

            {formName !== null && <CompanyForm initialName={formName} onClose={() => setFormName(null)} />}
        </div>
    );
}
