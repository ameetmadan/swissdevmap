import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'chunk-reload-attempted';

interface ReloadDeps {
    storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
    reload: () => void;
}

const browserDeps = (): ReloadDeps => ({
    storage: window.sessionStorage,
    reload: () => window.location.reload(),
});

/**
 * Runs a dynamic import. A deploy replaces the hashed chunks, so a tab opened before it asks for
 * files that no longer exist (the host answers with index.html, which fails as a module). One reload
 * picks up the new index.html; the flag keeps a genuine failure (offline, blocked) from looping.
 */
export async function importWithReload<T>(
    factory: () => Promise<T>,
    deps: () => ReloadDeps = browserDeps
): Promise<T> {
    let storage: ReloadDeps['storage'] | null = null;
    try {
        storage = deps().storage;
    } catch {
        /* storage blocked: fall through and surface the error without reloading */
    }

    try {
        const module = await factory();
        storage?.removeItem(RELOAD_FLAG);
        return module;
    } catch (error) {
        if (!storage || storage.getItem(RELOAD_FLAG)) throw error;
        storage.setItem(RELOAD_FLAG, '1');
        deps().reload();
        // Hold the Suspense fallback while the page reloads instead of flashing the error boundary.
        return new Promise<T>(() => {});
    }
}

export function lazyWithReload<P extends object>(
    factory: () => Promise<{ default: ComponentType<P> }>
) {
    return lazy(() => importWithReload(factory));
}
