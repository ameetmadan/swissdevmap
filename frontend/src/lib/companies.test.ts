import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('axios', () => ({ default: { get, post } }));

import { companyParams, submitCompany } from './companies';

const payload = { name: 'Acme', website: '', city: 'Zürich', lat: 47, lng: 8, tags: [] };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('companyParams', () => {
    it('sends every selected technology and company type', () => {
        const params = companyParams(['React', 'Go'], ['Fintech', 'Consulting']);
        expect(params.getAll('tag')).toEqual(['React', 'Go']);
        expect(params.getAll('type')).toEqual(['Fintech', 'Consulting']);
    });
});

describe('submitCompany', () => {
    it('refreshes with all active filters, not just the first technology', async () => {
        post.mockResolvedValue({ data: { id: 'c1' } });
        get.mockResolvedValue({ data: [] });
        await submitCompany(payload, ['React', 'Go'], ['Fintech']);
        const { params } = get.mock.calls[0][1];
        expect(params.getAll('tag')).toEqual(['React', 'Go']);
        expect(params.getAll('type')).toEqual(['Fintech']);
    });

    it('still reports success when the refresh fails', async () => {
        post.mockResolvedValue({ data: { id: 'c1' } });
        get.mockRejectedValue(new Error('network down'));
        await expect(submitCompany(payload, [], [])).resolves.toEqual({ saved: { id: 'c1' }, companies: null });
    });

    it('rejects when the save fails, without refreshing', async () => {
        post.mockRejectedValue(new Error('500'));
        await expect(submitCompany(payload, [], [])).rejects.toThrow('500');
        expect(get).not.toHaveBeenCalled();
    });
});
