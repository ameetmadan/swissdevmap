import { coverTransform, wrapText } from './exportGeometry';
import type { MapSnapshot } from './mapSnapshot';

export const EXPORT_WIDTH = 1200;
export const EXPORT_HEIGHT = 630;

export interface ExportInfo {
    title: string;
    subtitle: string;
    /** Short form of the shareable link, e.g. swissdevmap.ch/?tag=Rust */
    link: string;
    heatmapTech: string | null;
    commuteActive: boolean;
}

const LEGEND = [
    { color: '#3b82f6', label: 'Frontend' },
    { color: '#10b981', label: 'Backend' },
    { color: '#f59e0b', label: 'Cloud' },
    { color: '#8b5cf6', label: 'DevOps' },
];
const HEAT_GRADIENT = ['#172554', '#1d4ed8', '#fbbf24', '#f97316', '#dc2626'];
const PAD = 56;
const FONT = "Inter, -apple-system, 'Segoe UI', sans-serif";

// Dark enough behind the text to read over any terrain, easing out so the map still shows through.
function fade(ctx: CanvasRenderingContext2D, y0: number, y1: number, opaqueAtStart: boolean) {
    const gradient = ctx.createLinearGradient(0, y0, 0, y1);
    const [strong, mid, none] = ['rgba(8,12,20,0.94)', 'rgba(8,12,20,0.72)', 'rgba(8,12,20,0)'];
    gradient.addColorStop(0, opaqueAtStart ? strong : none);
    gradient.addColorStop(0.55, mid);
    gradient.addColorStop(1, opaqueAtStart ? none : strong);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, Math.min(y0, y1), EXPORT_WIDTH, Math.abs(y1 - y0));
}

function drawMap(ctx: CanvasRenderingContext2D, snapshot: MapSnapshot) {
    const { scale, dx, dy } = coverTransform(snapshot.region, EXPORT_WIDTH, EXPORT_HEIGHT);
    const place = (r: { x: number; y: number; width: number; height: number }) =>
        // The extra half pixel hides seams between tiles after scaling.
        [r.x * scale + dx, r.y * scale + dy, r.width * scale + 0.5, r.height * scale + 0.5] as const;

    for (const tile of snapshot.tiles) ctx.drawImage(tile.source, ...place(tile));
    if (snapshot.heat) ctx.drawImage(snapshot.heat.source, ...place(snapshot.heat));

    const radius = 9 * Math.min(Math.max(scale, 0.9), 1.4);
    for (const marker of snapshot.markers) {
        const x = marker.x * scale + dx;
        const y = marker.y * scale + dy;
        if (x < -radius || y < -radius || x > EXPORT_WIDTH + radius || y > EXPORT_HEIGHT + radius) continue;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = marker.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = marker.inCommuteRange ? 3 : 1.5;
        ctx.strokeStyle = marker.inCommuteRange ? '#06b6d4' : 'rgba(255,255,255,0.55)';
        ctx.stroke();
    }
}

function drawHeader(ctx: CanvasRenderingContext2D, info: ExportInfo) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#93c5fd';
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText('SwissDevMap', PAD, 62);

    let size = 46;
    let lines: string[] = [];
    for (; size >= 32; size -= 6) {
        ctx.font = `700 ${size}px ${FONT}`;
        lines = wrapText((text) => ctx.measureText(text).width, info.title, EXPORT_WIDTH - PAD * 2);
        if (lines.length <= 2) break;
    }
    ctx.fillStyle = '#f1f5f9';
    lines.slice(0, 2).forEach((line, index) => ctx.fillText(line, PAD, 118 + index * (size + 6)));

    ctx.font = `500 24px ${FONT}`;
    ctx.fillStyle = '#b6c3d9';
    ctx.fillText(info.subtitle, PAD, 118 + Math.min(lines.length, 2) * (size + 6) + 6);
}

function drawLegend(ctx: CanvasRenderingContext2D, info: ExportInfo) {
    const baseline = EXPORT_HEIGHT - 44;
    let x = PAD;

    if (info.heatmapTech) {
        const gradient = ctx.createLinearGradient(x, 0, x + 170, 0);
        HEAT_GRADIENT.forEach((color, index) => gradient.addColorStop(index / (HEAT_GRADIENT.length - 1), color));
        ctx.fillStyle = gradient;
        ctx.fillRect(x, baseline - 62, 170, 10);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = `600 15px ${FONT}`;
        ctx.fillText(`${info.heatmapTech} density: low → high`, x, baseline - 70);
    }

    ctx.font = `600 16px ${FONT}`;
    const items = [...LEGEND, ...(info.commuteActive ? [{ color: '#06b6d4', label: 'Within commute' }] : [])];
    for (const item of items) {
        ctx.beginPath();
        ctx.arc(x + 6, baseline - 5, 6, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(item.label, x + 20, baseline);
        x += 20 + ctx.measureText(item.label).width + 22;
    }
}

function drawFooter(ctx: CanvasRenderingContext2D, info: ExportInfo) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText(info.link, EXPORT_WIDTH - PAD, EXPORT_HEIGHT - 66);
    // Tile attribution is a licence requirement of OpenStreetMap, so it is always drawn.
    ctx.fillStyle = '#94a3b8';
    ctx.font = `400 13px ${FONT}`;
    ctx.fillText('Map © OpenStreetMap contributors', EXPORT_WIDTH - PAD, EXPORT_HEIGHT - 40);
    ctx.textAlign = 'left';
}

export async function renderExportImage(snapshot: MapSnapshot, info: ExportInfo): Promise<Blob> {
    // Canvas text uses the page's web fonts only once they are loaded.
    await Promise.all([
        document.fonts?.load(`700 46px Inter`),
        document.fonts?.load(`500 24px Inter`),
        document.fonts?.load(`600 16px Inter`),
    ]).catch(() => undefined);

    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available in this browser');

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    drawMap(ctx, snapshot);
    fade(ctx, 0, 280, true);
    fade(ctx, EXPORT_HEIGHT - 190, EXPORT_HEIGHT, false);
    drawHeader(ctx, info);
    drawLegend(ctx, info);
    drawFooter(ctx, info);

    return new Promise((resolve, reject) => {
        // toBlob throws a SecurityError up front if a tile without CORS headers tainted the canvas.
        try {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))), 'image/png');
        } catch (error) {
            reject(error);
        }
    });
}
