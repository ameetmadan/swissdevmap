import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../db/pool', () => ({ pool: { query } }));

import { requireApiKey } from './apiKey';
import { fakeRequest, fakeResponse } from '../test/http';

const run = async (authorization?: string) => {
    const res = fakeResponse();
    const next = vi.fn();
    await requireApiKey(fakeRequest({ headers: { authorization } }), res, next);
    return { res, next };
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('requireApiKey', () => {
    it.each([
        ['a missing header', undefined],
        ['a non-bearer scheme', 'Basic abc'],
        ['an empty key', 'Bearer   '],
    ])('rejects %s without querying the database', async (_label, header) => {
        const { res, next } = await run(header);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(query).not.toHaveBeenCalled();
    });

    it('rejects an unknown or revoked key (only enabled keys are looked up)', async () => {
        query.mockResolvedValue({ rows: [] });
        const { res, next } = await run('Bearer secret');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        const [sql, params] = query.mock.calls[0];
        expect(sql).toContain('enabled = TRUE');
        expect(params).toEqual([crypto.createHash('sha256').update('secret').digest('hex')]);
    });

    it('lets a valid key through and records its use', async () => {
        query.mockResolvedValue({ rows: [{ id: 'k1' }] });
        const { res, next } = await run('Bearer secret');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(query).toHaveBeenCalledTimes(2);
    });

    it('answers 500 when the database fails', async () => {
        query.mockRejectedValue(new Error('down'));
        const { res, next } = await run('Bearer secret');
        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});
