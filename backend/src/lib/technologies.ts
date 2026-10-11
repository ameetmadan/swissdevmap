export interface Technology {
    /** The one spelling stored in tech_tags and matched by the frontend. */
    tag: string;
    category: string;
    /** Lower-case spellings found in job text. */
    aliases: string[];
}

export const TECHNOLOGIES: Technology[] = [
    { tag: 'React', category: 'frontend', aliases: ['react'] },
    { tag: 'Vue', category: 'frontend', aliases: ['vue'] },
    { tag: 'Angular', category: 'frontend', aliases: ['angular'] },
    { tag: 'Svelte', category: 'frontend', aliases: ['svelte'] },
    { tag: 'Next.js', category: 'frontend', aliases: ['next.js', 'nextjs'] },
    { tag: 'Java', category: 'backend', aliases: ['java'] },
    { tag: 'Kotlin', category: 'backend', aliases: ['kotlin'] },
    { tag: 'Scala', category: 'backend', aliases: ['scala'] },
    { tag: 'Python', category: 'backend', aliases: ['python'] },
    { tag: 'Go', category: 'backend', aliases: ['go', 'golang'] },
    { tag: 'Rust', category: 'backend', aliases: ['rust'] },
    { tag: 'C#', category: 'backend', aliases: ['c#'] },
    { tag: 'C++', category: 'backend', aliases: ['c++'] },
    { tag: 'Node.js', category: 'backend', aliases: ['node.js', 'node'] },
    { tag: 'TypeScript', category: 'backend', aliases: ['typescript'] },
    { tag: 'Ruby', category: 'backend', aliases: ['ruby'] },
    { tag: 'PostgreSQL', category: 'backend', aliases: ['postgresql', 'postgres'] },
    { tag: 'MySQL', category: 'backend', aliases: ['mysql'] },
    { tag: 'MongoDB', category: 'backend', aliases: ['mongodb'] },
    { tag: 'Redis', category: 'backend', aliases: ['redis'] },
    { tag: 'AWS', category: 'cloud', aliases: ['aws'] },
    { tag: 'Azure', category: 'cloud', aliases: ['azure'] },
    { tag: 'GCP', category: 'cloud', aliases: ['gcp', 'google cloud'] },
    { tag: 'Kubernetes', category: 'devops', aliases: ['kubernetes'] },
    { tag: 'Docker', category: 'devops', aliases: ['docker'] },
    { tag: 'Terraform', category: 'devops', aliases: ['terraform'] },
    { tag: 'Kafka', category: 'devops', aliases: ['kafka'] },
];

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// \b cannot end a match after "+" or "#" (both are non-word characters), so "C++ developer" never matched.
// Lookarounds ask for "not part of a longer word" instead, which holds for symbols and letters alike.
const MATCHERS = TECHNOLOGIES.map((technology) => ({
    technology,
    pattern: new RegExp(`(?<!\\w)(?:${technology.aliases.map(escapeRegExp).join('|')})(?!\\w)`),
}));

export function extractTags(text: string): { tag: string; category: string }[] {
    const lower = text.toLowerCase();
    return MATCHERS
        .filter(({ pattern }) => pattern.test(lower))
        .map(({ technology: { tag, category } }) => ({ tag, category }));
}
