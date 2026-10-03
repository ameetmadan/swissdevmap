export interface SharePayload {
    url: string;
    title: string;
    text: string;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export interface ShareEnv {
    share?: (data: SharePayload) => Promise<void>;
    writeText?: (text: string) => Promise<void>;
}

function browserEnv(): ShareEnv {
    return {
        share: navigator.share?.bind(navigator),
        writeText: navigator.clipboard?.writeText.bind(navigator.clipboard),
    };
}

/** Opens the native share sheet where there is one, otherwise copies the link. */
export async function shareLink(payload: SharePayload, env: ShareEnv = browserEnv()): Promise<ShareOutcome> {
    if (env.share) {
        try {
            await env.share(payload);
            return 'shared';
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
            // Any other native failure (blocked, unsupported payload) still has the clipboard to fall back on.
        }
    }
    if (!env.writeText) return 'failed';
    try {
        await env.writeText(payload.url);
        return 'copied';
    } catch {
        return 'failed';
    }
}

/** Copy-only counterpart to shareLink, for snippets that should never open a share sheet. */
export async function copyText(text: string, env: Pick<ShareEnv, 'writeText'> = browserEnv()): Promise<'copied' | 'failed'> {
    if (!env.writeText) return 'failed';
    try {
        await env.writeText(text);
        return 'copied';
    } catch {
        return 'failed';
    }
}
