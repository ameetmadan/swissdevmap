export const TAGS_BY_CATEGORY: Array<{ category: string; label: string; tags: string[] }> = [
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

export const COMPANY_TYPES = ['Enterprise', 'Fintech', 'Consulting', 'E-Commerce', 'Industrial'];

export const HEATMAP_GROUPS: Array<{ label: string; techs: string[] }> = [
    { label: 'Frontend', techs: ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript'] },
    { label: 'Backend', techs: ['Java', 'Python', 'Go', 'Rust', 'Node.js', 'Scala', 'C#'] },
    { label: 'Cloud', techs: ['AWS', 'Azure', 'GCP'] },
];

export const COMMUTE_MINUTE_OPTIONS = [15, 20, 30, 45, 60];
export const DEFAULT_COMMUTE_MINUTES = 30;
export const DEFAULT_HEATMAP_TECH = 'React';
