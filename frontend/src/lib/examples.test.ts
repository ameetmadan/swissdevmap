import { describe, expect, it } from 'vitest';
import { EXAMPLE_VIEWS } from './examples';
import { applyView, parseView, viewKey } from './viewUrl';

describe('EXAMPLE_VIEWS', () => {
    it('has unique ids and labels', () => {
        expect(new Set(EXAMPLE_VIEWS.map((e) => e.id)).size).toBe(EXAMPLE_VIEWS.length);
        expect(new Set(EXAMPLE_VIEWS.map((e) => e.label)).size).toBe(EXAMPLE_VIEWS.length);
    });

    it.each(EXAMPLE_VIEWS)('$id survives the URL round trip, so it is shareable', ({ view }) => {
        expect(parseView(applyView('', view))).toEqual(view);
        expect(viewKey(view)).not.toBe('');
    });
});
