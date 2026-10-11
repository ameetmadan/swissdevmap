import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, get } = vi.hoisted(() => ({ query: vi.fn(), get: vi.fn() }));
vi.mock('../db/pool', () => ({ pool: { query } }));
vi.mock('axios', () => ({ default: { get } }));

import { commuteSearch } from './commute';
import { fakeRequest, fakeResponse } from '../test/http';

const search = async (from: unknown = 'Bern', minutes: unknown = '30') => {
    const res = fakeResponse();
    await commuteSearch(fakeRequest({ query: { from, minutes } as never }), res);
    return res;
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    query.mockImplementation(async (sql: string) =>
        String(sql).includes('DISTINCT city') ? { rows: [{ city: 'Zug' }] } : { rows: [{ id: 'c1', city: 'Zug' }] });
});

describe('commuteSearch', () => {
    it('only asks for destination cities that are set', async () => {
        await search();
        const [sql] = query.mock.calls[0];
        expect(sql).toMatch(/city IS NOT NULL AND btrim\(city\) <> ''/);
    });

    it('rejects a missing, non-string or oversized origin', async () => {
        expect((await search('')).status).toHaveBeenCalledWith(400);
        expect((await search(['Bern', 'Zug'])).status).toHaveBeenCalledWith(400);
        expect((await search('x'.repeat(101))).status).toHaveBeenCalledWith(400);
    });

    it('returns companies in cities within range', async () => {
        get.mockResolvedValue({ data: { connections: [{ duration: '00d00:20:00' }] } });
        const res = await search();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ reachableCities: ['Zug'] }));
    });

    it('answers 502 instead of an empty result when the transport API times out', async () => {
        get.mockRejectedValue(Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' }));
        const res = await search();
        expect(res.status).toHaveBeenCalledWith(502);
    });

    it('answers 502 when the transport API fails with a server error', async () => {
        get.mockRejectedValue(Object.assign(new Error('bad gateway'), { response: { status: 503 } }));
        expect((await search()).status).toHaveBeenCalledWith(502);
    });

    it('still reports 429 as rate limiting', async () => {
        get.mockRejectedValue(Object.assign(new Error('slow down'), { response: { status: 429 } }));
        expect((await search()).status).toHaveBeenCalledWith(429);
    });

    it('treats a rejected station lookup as unreachable, not as an outage', async () => {
        get.mockRejectedValue(Object.assign(new Error('bad request'), { response: { status: 400 } }));
        const res = await search();
        expect(res.json).toHaveBeenCalledWith({ reachableCities: [], companies: [] });
    });
});
