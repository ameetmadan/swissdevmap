import type { Rect } from './mapSnapshot';
import { slugify } from './slug';

/**
 * The part of the map the visitor can see. The sidebar covers the left on desktop and the bottom
 * sheet covers the bottom on phones; either way the rest of the map is what belongs in the image.
 */
export function visibleRegion(container: Rect, sidebar: Rect | null): Rect {
    const full: Rect = { x: 0, y: 0, width: container.width, height: container.height };
    if (!sidebar) return full;

    const left = sidebar.x - container.x;
    const top = sidebar.y - container.y;
    const coversLeft = left <= 1 && sidebar.width < container.width && sidebar.height >= container.height - 1;
    if (coversLeft) {
        const edge = left + sidebar.width;
        return { x: edge, y: 0, width: container.width - edge, height: container.height };
    }
    const coversBottom = top > 0 && top + sidebar.height >= container.height - 1 && sidebar.width >= container.width - 1;
    if (coversBottom) return { x: 0, y: 0, width: container.width, height: top };
    return full;
}

/** Maps container coordinates into an out-sized canvas so `region` fills it, cropping the overflow. */
export function coverTransform(region: Rect, outWidth: number, outHeight: number) {
    const scale = Math.max(outWidth / region.width, outHeight / region.height);
    return {
        scale,
        dx: (outWidth - region.width * scale) / 2 - region.x * scale,
        dy: (outHeight - region.height * scale) / 2 - region.y * scale,
    };
}

/** Greedy word wrap. A single word wider than the limit keeps its own line rather than being cut. */
export function wrapText(measure: (text: string) => number, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && measure(candidate) > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines;
}

export function exportFilename(title: string): string {
    const slug = slugify(title).slice(0, 60).replace(/-+$/, '');
    return `swissdevmap-${slug || 'map'}.png`;
}
