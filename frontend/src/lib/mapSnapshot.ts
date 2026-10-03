export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SnapshotImage extends Rect {
    source: CanvasImageSource;
}

export interface SnapshotMarker {
    x: number;
    y: number;
    color: string;
    inCommuteRange: boolean;
}

/** Everything the exporter needs from the live map, in CSS pixels relative to the map container. */
export interface MapSnapshot {
    region: Rect;
    tiles: SnapshotImage[];
    heat: SnapshotImage | null;
    markers: SnapshotMarker[];
}

// The map component registers how to read itself, so the exporter never reaches into Leaflet.
let source: (() => MapSnapshot | null) | null = null;

export function registerSnapshotSource(fn: () => MapSnapshot | null): () => void {
    source = fn;
    return () => {
        if (source === fn) source = null;
    };
}

export const captureMapSnapshot = (): MapSnapshot | null => source?.() ?? null;
