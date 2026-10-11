import { describe, expect, it } from 'vitest';
import { extractTags } from './technologies';

const tagsOf = (text: string) => extractTags(text).map((t) => t.tag);

describe('extractTags', () => {
    it('finds symbol-based languages followed by whitespace or punctuation', () => {
        expect(tagsOf('We need a C++ developer with C# skills.')).toEqual(['C#', 'C++']);
        expect(tagsOf('Experience in C++, C#')).toEqual(['C#', 'C++']);
    });

    it('emits the canonical spelling', () => {
        expect(tagsOf('AWS, GCP and PostgreSQL on Kubernetes')).toEqual(['PostgreSQL', 'AWS', 'GCP', 'Kubernetes']);
    });

    it('folds aliases into one tag', () => {
        expect(tagsOf('postgres and postgresql; google cloud / gcp')).toEqual(['PostgreSQL', 'GCP']);
        expect(tagsOf('golang or go')).toEqual(['Go']);
        expect(tagsOf('next.js, nextjs')).toEqual(['Next.js']);
    });

    it('does not match inside longer words', () => {
        expect(tagsOf('javascript and reactive programming')).toEqual([]);
    });
});
