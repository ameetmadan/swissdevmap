// Type shim for leaflet.heat (no official @types package)
declare module 'leaflet.heat' {
    export { };
}

declare namespace L {
    function heatLayer(
        latlngs: Array<[number, number, number?]>,
        options?: {
            minOpacity?: number;
            maxZoom?: number;
            max?: number;
            radius?: number;
            blur?: number;
            gradient?: Record<number, string>;
        }
    ): Layer;
}
