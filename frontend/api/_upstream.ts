const UPSTREAM_TIMEOUT_MS = 3000;

export const apiBase = (): string => (process.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** null on any failure, so callers can fall back to default content instead of erroring. */
export async function fetchJson<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res.ok ? ((await res.json()) as T) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
