import axios from 'axios';
import type { Company } from '../store/mapStore';

/** The one place that turns the active filters into a /api/companies query, shared by every caller. */
export function companyParams(tags: readonly string[], types: readonly string[]): URLSearchParams {
    const params = new URLSearchParams();
    tags.forEach((tag) => params.append('tag', tag));
    types.forEach((type) => params.append('type', type));
    return params;
}

export async function fetchCompanies(
    tags: readonly string[],
    types: readonly string[],
    signal?: AbortSignal,
): Promise<Company[]> {
    const res = await axios.get<Company[]>('/api/companies', { params: companyParams(tags, types), signal });
    return res.data;
}

export interface NewCompanyPayload {
    name: string;
    website: string;
    city: string;
    lat: number;
    lng: number;
    tags: { tag: string; category: string }[];
}

/**
 * Saves a company, then reloads the list for the active filters. Only the save can fail the call: once
 * the company exists, a failed reload comes back as `companies: null` so the form never reports a saved
 * company as failed (which invites a duplicate submission).
 */
export async function submitCompany(
    payload: NewCompanyPayload,
    tags: readonly string[],
    types: readonly string[],
): Promise<{ saved: Company; companies: Company[] | null }> {
    const saved = (await axios.post<Company>('/api/companies', payload)).data;
    const companies = await fetchCompanies(tags, types).catch((error) => {
        console.error(error);
        return null;
    });
    return { saved, companies };
}
