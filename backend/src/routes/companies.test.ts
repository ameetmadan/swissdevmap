import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, release, connect } = vi.hoisted(() => ({
    query: vi.fn(),
    release: vi.fn(),
    connect: vi.fn(),
}));
vi.mock('../db/pool', () => ({ pool: { connect } }));
vi.mock('../db/insertCompany', () => ({ insertCompany: vi.fn().mockResolvedValue({ id: 'c1', slug: 'acme-zurich' }) }));

import { createCompany } from './companies';
import { fakeRequest, fakeResponse } from '../test/http';

const body = {
    name: 'Acme AG', city: 'Zürich', lat: 47.37, lng: 8.54,
    tags: [{ tag: 'React', category: 'frontend' }],
};
const stored = { id: 'c1', name: 'Acme AG', tags: [] };

const statements = () => query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0]);

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    connect.mockResolvedValue({ query, release });
    query.mockImplementation(async (sql: string) =>
        String(sql).includes('json_agg') ? { rows: [stored] } : { rows: [] });
});

describe('createCompany', () => {
    it('answers 400 without touching the database for an invalid submission', async () => {
        const res = fakeResponse();
        await createCompany(fakeRequest({ body: { ...body, city: undefined } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(connect).not.toHaveBeenCalled();
    });

    it('rejects a prototype tag category', async () => {
        const res = fakeResponse();
        await createCompany(fakeRequest({ body: { ...body, tags: [{ tag: 'x', category: '__proto__' }] } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(connect).not.toHaveBeenCalled();
    });

    it('reads the response record before committing and then sends it', async () => {
        const res = fakeResponse();
        await createCompany(fakeRequest({ body }), res);
        expect(statements()).toEqual(['BEGIN', 'INSERT', 'SELECT', 'COMMIT']);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(stored);
        expect(release).toHaveBeenCalledWith(false);
    });

    it('answers 500 and releases nothing when the connection is refused', async () => {
        connect.mockRejectedValue(new Error('connection refused'));
        const res = fakeResponse();
        await createCompany(fakeRequest({ body }), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(release).not.toHaveBeenCalled();
    });

    it('rolls back and reports failure when the response read fails', async () => {
        query.mockImplementation(async (sql: string) => {
            if (String(sql).includes('json_agg')) throw new Error('read failed');
            return { rows: [] };
        });
        const res = fakeResponse();
        await createCompany(fakeRequest({ body }), res);
        expect(statements()).toEqual(['BEGIN', 'INSERT', 'SELECT', 'ROLLBACK']);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('keeps the original error response when ROLLBACK also fails, and discards the connection', async () => {
        query.mockImplementation(async (sql: string) => {
            if (String(sql).includes('json_agg')) throw new Error('read failed');
            if (sql === 'ROLLBACK') throw new Error('connection lost');
            return { rows: [] };
        });
        const res = fakeResponse();
        await createCompany(fakeRequest({ body }), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create company' });
        expect(release).toHaveBeenCalledWith(true);
    });
});
