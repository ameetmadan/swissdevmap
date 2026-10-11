const CATEGORY_LABELS: ReadonlyMap<string, string> = new Map([
    ['frontend', 'Frontend'],
    ['backend', 'Backend'],
    ['cloud', 'Cloud'],
    ['devops', 'DevOps'],
]);

/** Display name for a category; unknown ones (including odd stored values like "__proto__") show as typed. */
export const categoryLabel = (category: string): string => CATEGORY_LABELS.get(category) ?? category;

/**
 * Groups tags by category, in first-seen order. Categories come from user submissions, so the groups
 * live in a Map: a plain object would treat a category like "__proto__" as an inherited property.
 */
export function groupTagsByCategory(tags: ReadonlyArray<{ tag: string; category?: string | null }>): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const { tag, category } of tags) {
        const key = category || 'other';
        const group = groups.get(key);
        if (group) group.push(tag);
        else groups.set(key, [tag]);
    }
    return groups;
}
