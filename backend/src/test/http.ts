import { vi } from 'vitest';
import type { Request, Response } from 'express';

export function fakeResponse() {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res as typeof res & Response;
}

export const fakeRequest = (parts: Partial<Request>) => parts as Request;
