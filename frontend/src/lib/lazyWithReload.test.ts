import { describe, expect, it, vi } from 'vitest';
import { importWithReload } from './lazyWithReload';

function makeDeps(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial));
    const reload = vi.fn();
    const deps = () => ({
        storage: {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => void store.set(k, v),
            removeItem: (k: string) => void store.delete(k),
        },
        reload,
    });
    return { deps, reload, store };
}

const chunkError = new TypeError("'text/html' is not a valid JavaScript MIME type for module script");

describe('importWithReload', () => {
    it('returns the module and clears the reload flag on success', async () => {
        const { deps, reload, store } = makeDeps({ 'chunk-reload-attempted': '1' });
        await expect(importWithReload(async () => 'mod', deps)).resolves.toBe('mod');
        expect(store.size).toBe(0);
        expect(reload).not.toHaveBeenCalled();
    });

    it('reloads once and never settles when the chunk fails to load', async () => {
        const { deps, reload, store } = makeDeps();
        const settled = vi.fn();
        void importWithReload(() => Promise.reject(chunkError), deps).then(settled, settled);
        await new Promise((r) => setTimeout(r, 0));
        expect(reload).toHaveBeenCalledTimes(1);
        expect(store.get('chunk-reload-attempted')).toBe('1');
        expect(settled).not.toHaveBeenCalled();
    });

    it('rethrows instead of reloading again after a reload already happened', async () => {
        const { deps, reload } = makeDeps({ 'chunk-reload-attempted': '1' });
        await expect(importWithReload(() => Promise.reject(chunkError), deps)).rejects.toBe(chunkError);
        expect(reload).not.toHaveBeenCalled();
    });

    it('rethrows when storage is unavailable, since a loop could not be prevented', async () => {
        const reload = vi.fn();
        const deps = () => {
            throw new Error('SecurityError');
        };
        await expect(importWithReload(() => Promise.reject(chunkError), deps)).rejects.toBe(chunkError);
        expect(reload).not.toHaveBeenCalled();
    });
});
