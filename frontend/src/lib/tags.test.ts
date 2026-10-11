import { describe, expect, it } from 'vitest';
import { categoryLabel, groupTagsByCategory } from './tags';

describe('groupTagsByCategory', () => {
    it('groups by category in first-seen order and files blank categories under "other"', () => {
        const groups = groupTagsByCategory([
            { tag: 'Rust', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'Odd', category: '' },
        ]);
        expect([...groups]).toEqual([
            ['backend', ['Rust', 'Go']],
            ['frontend', ['React']],
            ['other', ['Odd']],
        ]);
    });

    it.each(['__proto__', 'constructor', 'toString', 'hasOwnProperty'])('treats the category "%s" as a normal key', (category) => {
        const groups = groupTagsByCategory([{ tag: 'A', category }, { tag: 'B', category }]);
        expect(groups.get(category)).toEqual(['A', 'B']);
        expect(categoryLabel(category)).toBe(category);
    });
});

describe('categoryLabel', () => {
    it('labels the supported categories', () => {
        expect(categoryLabel('devops')).toBe('DevOps');
    });
});
