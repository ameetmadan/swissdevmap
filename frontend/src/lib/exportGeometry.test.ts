import { describe, expect, it } from 'vitest';
import { coverTransform, exportFilename, visibleRegion, wrapText } from './exportGeometry';

const container = { x: 0, y: 0, width: 1200, height: 760 };

describe('visibleRegion', () => {
    it('excludes a full-height sidebar on the left', () => {
        const sidebar = { x: 0, y: 0, width: 320, height: 760 };
        expect(visibleRegion(container, sidebar)).toEqual({ x: 320, y: 0, width: 880, height: 760 });
    });

    it('excludes a bottom sheet on phones', () => {
        const phone = { x: 0, y: 0, width: 390, height: 780 };
        const sheet = { x: 0, y: 716, width: 390, height: 600 };
        expect(visibleRegion(phone, sheet)).toEqual({ x: 0, y: 0, width: 390, height: 716 });
    });

    it('accounts for the container being offset on the page', () => {
        const offset = { x: 10, y: 20, width: 1000, height: 600 };
        const sidebar = { x: 10, y: 20, width: 300, height: 600 };
        expect(visibleRegion(offset, sidebar)).toEqual({ x: 300, y: 0, width: 700, height: 600 });
    });

    it('uses the whole map when there is no overlay', () => {
        expect(visibleRegion(container, null)).toEqual({ x: 0, y: 0, width: 1200, height: 760 });
    });
});

describe('coverTransform', () => {
    it('fills the canvas and centres the region', () => {
        const region = { x: 320, y: 0, width: 880, height: 760 };
        const { scale, dx, dy } = coverTransform(region, 1200, 630);
        expect(scale).toBeCloseTo(1200 / 880);
        // the region's centre lands on the canvas centre
        expect((region.x + region.width / 2) * scale + dx).toBeCloseTo(600);
        expect((region.y + region.height / 2) * scale + dy).toBeCloseTo(315);
    });

    it('scales by height when the region is wider than the canvas aspect', () => {
        const { scale } = coverTransform({ x: 0, y: 0, width: 2400, height: 630 }, 1200, 630);
        expect(scale).toBe(1);
    });
});

describe('wrapText', () => {
    const measure = (text: string) => text.length * 10;

    it('breaks on word boundaries within the limit', () => {
        expect(wrapText(measure, 'aaa bbb ccc ddd', 80)).toEqual(['aaa bbb', 'ccc ddd']);
    });

    it('keeps an over-long word on its own line', () => {
        expect(wrapText(measure, 'a loooooooooong b', 50)).toEqual(['a', 'loooooooooong', 'b']);
    });

    it('returns no lines for empty text', () => {
        expect(wrapText(measure, '   ', 100)).toEqual([]);
    });
});

describe('exportFilename', () => {
    it('slugs the title', () => {
        expect(exportFilename('Fintech companies using Rust in Switzerland')).toBe('swissdevmap-fintech-companies-using-rust-in-switzerland.png');
    });

    it('falls back when nothing usable remains', () => {
        expect(exportFilename('???')).toBe('swissdevmap-map.png');
    });
});
