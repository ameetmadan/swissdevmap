// Copy this file to seed-data.ts and fill in your own companies.
// seed-data.ts is gitignored so your company list stays private.

export interface Company {
    name: string;
    uid?: string;       // Optional: company registration number
    website: string;
    city: string;
    lat: number;
    lng: number;
    type?: string;      // e.g. 'Enterprise', 'Startup', 'Fintech', 'Consulting'
    tags: { tag: string; category: string }[];
}

export const companies: Company[] = [
    {
        name: 'Example Corp',
        type: 'Startup',
        website: 'https://example.com',
        city: 'Zürich',
        lat: 47.3769,
        lng: 8.5417,
        tags: [
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Another Company',
        type: 'Enterprise',
        uid: 'CHE-000.000.000',
        website: 'https://another.ch',
        city: 'Bern',
        lat: 46.9480,
        lng: 7.4474,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
];
