// @vitest-environment jsdom
import { act, createElement, MutableRefObject } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { get, heatLayer } = vi.hoisted(() => ({ get: vi.fn(), heatLayer: vi.fn() }));
vi.mock('axios', () => ({ default: { get } }));
vi.mock('leaflet', () => ({ default: { heatLayer } }));

import type L from 'leaflet';
import { useHeatmapLayer } from './useHeatmapLayer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Pending {
    signal: AbortSignal;
    respond: () => Promise<void>;
}

let root: Root;
const map = { removeLayer: vi.fn() };
const mapRef = { current: map } as unknown as MutableRefObject<L.Map | null>;
const requests: Pending[] = [];

function Harness({ active, tech }: { active: boolean; tech: string }) {
    useHeatmapLayer(mapRef, active, tech);
    return null;
}

const render = (active: boolean, tech: string) =>
    act(async () => { root.render(createElement(Harness, { active, tech })); });

beforeEach(() => {
    vi.clearAllMocks();
    requests.length = 0;
    root = createRoot(document.createElement('div'));
    // Each call parks until the test decides when its response arrives.
    get.mockImplementation((_url: string, config: { signal: AbortSignal; params: { tech: string } }) =>
        new Promise((resolve) => {
            requests.push({
                signal: config.signal,
                respond: () => act(async () => {
                    resolve({ data: { features: [{ geometry: { coordinates: [8.5, 47.4] }, properties: { intensity: 3 } }] } });
                }),
            });
        }));
    heatLayer.mockImplementation(() => {
        const layer = { addTo: vi.fn(() => layer) };
        return layer;
    });
});

afterEach(() => act(async () => root.unmount()));

describe('useHeatmapLayer', () => {
    it('adds the layer once the response arrives', async () => {
        await render(true, 'React');
        await requests[0].respond();
        expect(heatLayer).toHaveBeenCalledTimes(1);
    });

    it('drops a response that arrives after the heatmap was switched off', async () => {
        await render(true, 'React');
        await render(false, 'React');
        expect(requests[0].signal.aborted).toBe(true);
        await requests[0].respond();
        expect(heatLayer).not.toHaveBeenCalled();
    });

    it('keeps only the latest technology when responses arrive out of order', async () => {
        await render(true, 'React');
        await render(true, 'Go');
        await requests[1].respond();
        await requests[0].respond();
        expect(heatLayer).toHaveBeenCalledTimes(1);
    });

    it('removes the layer it added when the technology changes or the heatmap is turned off', async () => {
        await render(true, 'React');
        await requests[0].respond();
        const layer = heatLayer.mock.results[0].value;
        await render(false, 'React');
        expect(map.removeLayer).toHaveBeenCalledWith(layer);
    });
});
