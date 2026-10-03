import { create } from 'zustand';
import { DEFAULT_COMMUTE_MINUTES, DEFAULT_HEATMAP_TECH } from '../lib/filterOptions';
import { parseView, ViewState } from '../lib/viewUrl';

export interface Company {
    id: string;
    name: string;
    uid?: string;
    website: string;
    city: string;
    lat: number;
    lng: number;
    type?: string;
    tags: { tag: string; category: string }[];
}

export interface MapState {
    companies: Company[];
    selectedTags: string[];
    selectedTypes: string[];
    heatmapActive: boolean;
    heatmapTech: string;
    commuteFrom: string;
    commuteMinutes: number;
    commuteAppliedMinutes: number;
    commuteCompanyIds: string[];
    selectedCompanyId: string | null;
    loading: boolean;
    commuteLoading: boolean;
    commute429: boolean;

    setCompanies: (companies: Company[]) => void;
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
}

// The URL is the source of truth on load, so a shared link opens exactly the sender's view.
const initialView = parseView(typeof window === 'undefined' ? '' : window.location.search);

export const useMapStore = create<MapState>((set) => ({
    companies: [],
    selectedTags: initialView.tags,
    selectedTypes: initialView.types,
    heatmapActive: initialView.heatmapTech !== null,
    heatmapTech: initialView.heatmapTech ?? DEFAULT_HEATMAP_TECH,
    commuteFrom: initialView.commute?.from ?? '',
    commuteMinutes: initialView.commute?.minutes ?? DEFAULT_COMMUTE_MINUTES,
    commuteAppliedMinutes: initialView.commute?.minutes ?? DEFAULT_COMMUTE_MINUTES,
    commuteCompanyIds: [],
    selectedCompanyId: null,
    loading: false,
    commuteLoading: false,
    commute429: false,

    setCompanies: (companies) => set({ companies }),
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
        set({ commuteFrom: from.trim(), commuteMinutes: minutes, commuteAppliedMinutes: minutes }),
    clearCommute: () => set({ commuteFrom: '', commuteCompanyIds: [] }),
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
