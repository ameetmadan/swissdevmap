/** "Zürich" -> "zurich". Mirrors the backend's company slugs so the two never disagree on a city. */
export function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Spells out the symbols that would otherwise collapse: "C++" and "C#" must not both become "c". */
export function tagSlug(tag: string): string {
    return slugify(tag.replace(/\+/g, ' plus ').replace(/#/g, ' sharp '));
}
