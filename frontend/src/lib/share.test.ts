import { describe, expect, it, vi } from 'vitest';
import { copyText, shareLink } from './share';

const payload = { url: 'https://swissdevmap.ch/?tag=Rust', title: 'Rust', text: 'Rust companies' };

describe('shareLink', () => {
    it('uses the native share sheet when available', async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        const writeText = vi.fn();
        expect(await shareLink(payload, { share, writeText })).toBe('shared');
        expect(share).toHaveBeenCalledWith(payload);
        expect(writeText).not.toHaveBeenCalled();
    });

    it('treats a dismissed share sheet as cancelled, without copying', async () => {
        const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
        const writeText = vi.fn();
        expect(await shareLink(payload, { share, writeText })).toBe('cancelled');
        expect(writeText).not.toHaveBeenCalled();
    });

    it('falls back to the clipboard when native sharing throws', async () => {
        const share = vi.fn().mockRejectedValue(new DOMException('blocked', 'NotAllowedError'));
        const writeText = vi.fn().mockResolvedValue(undefined);
        expect(await shareLink(payload, { share, writeText })).toBe('copied');
        expect(writeText).toHaveBeenCalledWith(payload.url);
    });

    it('copies the bare URL when there is no native share', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        expect(await shareLink(payload, { writeText })).toBe('copied');
        expect(writeText).toHaveBeenCalledWith(payload.url);
    });

    it('reports failure when the clipboard is unavailable or rejects', async () => {
        expect(await shareLink(payload, {})).toBe('failed');
        const writeText = vi.fn().mockRejectedValue(new Error('denied'));
        expect(await shareLink(payload, { writeText })).toBe('failed');
    });
});

describe('copyText', () => {
    it('copies without involving the share sheet', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        expect(await copyText('<a href="x">', { writeText })).toBe('copied');
        expect(writeText).toHaveBeenCalledWith('<a href="x">');
    });

    it('reports failure when the clipboard is missing or rejects', async () => {
        expect(await copyText('x', {})).toBe('failed');
        expect(await copyText('x', { writeText: vi.fn().mockRejectedValue(new Error('denied')) })).toBe('failed');
    });
});
