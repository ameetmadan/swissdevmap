import { create } from 'zustand';
import { DEFAULT_COMMUTE_MINUTES, DEFAULT_HEATMAP_TECH } from '../lib/filterOptions';
import { parseView, ViewState } from '../lib/viewUrl';

export interface Company {
    id: string;
    name: string;
    uid?: string;
    slug?: string;
    website: string;
    city: string;
    lat: number;
    lng: number;
    type?: string;
    tags: { tag: string; category: string }[];
}

export interface MapFocus {
    lat: number;
    lng: number;
    zoom: number;
}

export interface MapState {
    companies: Company[];
    /** False until the first company response arrives, so empty states don't flash on load. */
    companiesLoaded: boolean;
    /** The last filtered-company request failed; `companies` is cleared so stale results aren't shown. */
    companiesFailed: boolean;
    /** Bumped to refetch the filtered companies with unchanged filters (Retry). */
    companiesReload: number;
    /** Unfiltered list that feeds search. null means it must be (re)loaded. */
    allCompanies: Company[] | null;
    mapFocus: MapFocus | null;
    selectedTags: string[];
    selectedTypes: string[];
    heatmapActive: boolean;
    heatmapTech: string;
    commuteFrom: string;
    commuteMinutes: number;
    commuteAppliedMinutes: number;
    commuteCompanyIds: string[];
    /** Bumped on every Filter press, so repeating the same search runs again (Retry). */
    commuteRequest: number;
    commuteFailed: boolean;
    selectedCompanyId: string | null;
    loading: boolean;
    commuteLoading: boolean;
    commute429: boolean;

    setCompanies: (companies: Company[]) => void;
    failCompanies: () => void;
    reloadCompanies: () => void;
    setAllCompanies: (companies: Company[] | null) => void;
    focusMap: (focus: MapFocus) => void;
    toggleTag: (tag: string) => void;
    toggleType: (type: string) => void;
    clearFilters: () => void;
    setHeatmapActive: (active: boolean) => void;
    setHeatmapTech: (tech: string) => void;
    setCommuteMinutes: (min: number) => void;
    applyCommute: (from: string, minutes: number) => void;
    clearCommute: () => void;
    setView: (view: ViewState) => void;
    setCommuteCompanyIds: (ids: string[]) => void;
    setSelectedCompanyId: (id: string | null) => void;
    setLoading: (loading: boolean) => void;
    setCommuteLoading: (loading: boolean) => void;
    setCommute429: (is429: boolean) => void;
    setCommuteFailed: (failed: boolean) => void;
}

// The URL is the source of truth on load, so a shared link opens exactly the sender's view.
const initialView = parseView(typeof window === 'undefined' ? '' : window.location.search);

export const useMapStore = create<MapState>((set) => ({
    companies: [],
    companiesLoaded: false,
    companiesFailed: false,
    companiesReload: 0,
    allCompanies: null,
    mapFocus: null,
    selectedTags: initialView.tags,
    selectedTypes: initialView.types,
    heatmapActive: initialView.heatmapTech !== null,
    heatmapTech: initialView.heatmapTech ?? DEFAULT_HEATMAP_TECH,
    commuteFrom: initialView.commute?.from ?? '',
    commuteMinutes: initialView.commute?.minutes ?? DEFAULT_COMMUTE_MINUTES,
    commuteAppliedMinutes: initialView.commute?.minutes ?? DEFAULT_COMMUTE_MINUTES,
    commuteCompanyIds: [],
    commuteRequest: 0,
    commuteFailed: false,
    selectedCompanyId: null,
    loading: false,
    commuteLoading: false,
    commute429: false,

    setCompanies: (companies) => set({ companies, companiesLoaded: true, companiesFailed: false }),
    failCompanies: () => set({ companies: [], companiesLoaded: true, companiesFailed: true }),
    reloadCompanies: () => set((state) => ({ companiesFailed: false, companiesReload: state.companiesReload + 1 })),
    setAllCompanies: (allCompanies) => set({ allCompanies }),
    // A fresh object per call, so asking for the same place twice still moves the map.
    focusMap: (focus) => set({ mapFocus: { ...focus } }),
    toggleTag: (tag) =>
        set((state) => ({
            selectedTags: state.selectedTags.includes(tag)
                ? state.selectedTags.filter((t) => t !== tag)
                : [...state.selectedTags, tag],
        })),
    toggleType: (type) =>
        set((state) => ({
            selectedTypes: state.selectedTypes.includes(type)
                ? state.selectedTypes.filter((t) => t !== type)
                : [...state.selectedTypes, type],
        })),
    clearFilters: () => set({ selectedTags: [], selectedTypes: [] }),
    setHeatmapActive: (heatmapActive) => set({ heatmapActive }),
    setHeatmapTech: (heatmapTech) => set({ heatmapTech }),
    setCommuteMinutes: (commuteMinutes) => set({ commuteMinutes }),
    applyCommute: (from, minutes) =>
        set((state) => ({
            commuteFrom: from.trim(),
            commuteMinutes: minutes,
            commuteAppliedMinutes: minutes,
            commuteRequest: state.commuteRequest + 1,
        })),
    clearCommute: () => set({ commuteFrom: '', commuteCompanyIds: [], commuteFailed: false }),
    setView: (view) =>
        set((state) => ({
            selectedTags: view.tags,
            selectedTypes: view.types,
            heatmapActive: view.heatmapTech !== null,
            heatmapTech: view.heatmapTech ?? state.heatmapTech,
            commuteFrom: view.commute?.from ?? '',
            commuteMinutes: view.commute?.minutes ?? state.commuteMinutes,
            commuteAppliedMinutes: view.commute?.minutes ?? state.commuteAppliedMinutes,
            commuteCompanyIds: view.commute ? state.commuteCompanyIds : [],
        })),
    setCommuteCompanyIds: (commuteCompanyIds) => set({ commuteCompanyIds }),
    setSelectedCompanyId: (selectedCompanyId) => set({ selectedCompanyId }),
    setLoading: (loading) => set({ loading }),
    setCommuteLoading: (commuteLoading) => set({ commuteLoading }),
    setCommute429: (commute429) => set({ commute429 }),
    setCommuteFailed: (commuteFailed) => set({ commuteFailed }),
}));

export function selectView(state: MapState): ViewState {
    return {
        tags: state.selectedTags,
        types: state.selectedTypes,
        heatmapTech: state.heatmapActive ? state.heatmapTech : null,
        commute: state.commuteFrom
            ? { from: state.commuteFrom, minutes: state.commuteAppliedMinutes }
            : null,
    };
}
