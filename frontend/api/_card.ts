export const WIDTH = 1200;
export const HEIGHT = 630;
const MAX_TITLE = 90;
const MAX_SUBTITLE = 120;
const MAX_TAGS = 6;

const clip = (value: string | null, max: number, fallback: string) => {
    const text = (value ?? '').trim() || fallback;
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

// satori takes plain element objects, which keeps JSX out of the serverless bundle.
const h = (type: string, style: Record<string, string | number>, children?: unknown) => ({
    type,
    props: { style: { display: 'flex', ...style }, children },
});

// Deterministic scatter of "company" dots so the card reads as a map without shipping tiles.
const DOTS = Array.from({ length: 28 }, (_, i) => ({
    x: (i * 137) % 1100 + 60,
    y: (i * 89) % 520 + 40,
    r: 6 + (i % 4) * 3,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 4],
}));

export function buildCard(searchParams: URLSearchParams) {
    const title = clip(searchParams.get('title'), MAX_TITLE, 'SwissDevMap');
    const subtitle = clip(searchParams.get('subtitle'), MAX_SUBTITLE, '');
    const tags = (searchParams.get('tags') ?? '')
        .split(',')
        .map((tag) => tag.trim().slice(0, 24))
        .filter(Boolean)
        .slice(0, MAX_TAGS);

    return h('div', {
        width: '100%', height: '100%', position: 'relative', background: '#080c14', color: '#e8edf5',
        fontFamily: 'sans-serif',
    }, [
        ...DOTS.map((dot) => h('div', {
            position: 'absolute', left: dot.x, top: dot.y, width: dot.r * 2, height: dot.r * 2,
            borderRadius: 999, background: dot.color, opacity: 0.18,
        })),
        h('div', { flexDirection: 'column', justifyContent: 'space-between', padding: 72, width: '100%', height: '100%' }, [
            h('div', { fontSize: 30, color: '#93c5fd', fontWeight: 700 }, 'SwissDevMap'),
            h('div', { flexDirection: 'column' }, [
                h('div', { fontSize: title.length > 40 ? 56 : 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }, title),
                subtitle ? h('div', { fontSize: 32, color: '#8a9ab5', marginTop: 20 }, subtitle) : h('div', {}, ''),
            ]),
            h('div', { gap: 12, flexWrap: 'wrap' }, tags.length
                ? tags.map((tag) => h('div', {
                    padding: '8px 20px', borderRadius: 999, fontSize: 26, color: '#93c5fd',
                    background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.5)',
                }, tag))
                : h('div', { fontSize: 26, color: '#4a5568' }, 'swissdevmap.ch')),
        ]),
    ]);
}
