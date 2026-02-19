import { create } from 'zustand';

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
    commuteCompanyIds: string[];
    selectedCompany: Company | null;
    loading: boolean;

    setCompanies: (companies: Company[]) => void;
    toggleTag: (tag: string) => void;
    toggleType: (type: string) => void;
    setHeatmapActive: (active: boolean) => void;
    setHeatmapTech: (tech: string) => void;
    setCommuteFrom: (city: string) => void;
    setCommuteMinutes: (min: number) => void;
    setCommuteCompanyIds: (ids: string[]) => void;
    setSelectedCompany: (company: Company | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
    companies: [],
    selectedTags: [],
    selectedTypes: [],
    heatmapActive: false,
    heatmapTech: 'React',
    commuteFrom: '',
    commuteMinutes: 30,
    commuteCompanyIds: [],
    selectedCompany: null,
    loading: false,

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
    setHeatmapActive: (heatmapActive) => set({ heatmapActive }),
    setHeatmapTech: (heatmapTech) => set({ heatmapTech }),
    setCommuteFrom: (commuteFrom) => set({ commuteFrom }),
    setCommuteMinutes: (commuteMinutes) => set({ commuteMinutes }),
    setCommuteCompanyIds: (commuteCompanyIds) => set({ commuteCompanyIds }),
    setSelectedCompany: (selectedCompany) => set({ selectedCompany }),
    setLoading: (loading) => set({ loading }),
}));
