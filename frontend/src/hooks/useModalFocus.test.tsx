// @vitest-environment jsdom
import { act, createElement, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalFocus } from './useModalFocus';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Dialog({ id, onClose }: { id: string; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref, onClose);
    return createElement('div', { ref, id, tabIndex: -1 },
        createElement('button', { id: `${id}-first` }, 'first'),
        createElement('button', { id: `${id}-last` }, 'last'));
}

const press = (key: string, shiftKey = false) => {
    const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
    document.activeElement?.dispatchEvent(event);
    return event;
};
const active = () => document.activeElement?.id;

let host: HTMLElement;
let root: Root;
let opener: HTMLButtonElement;

beforeEach(() => {
    host = document.body.appendChild(document.createElement('div'));
    opener = document.body.appendChild(document.createElement('button'));
    opener.id = 'opener';
    opener.focus();
    root = createRoot(host);
});

afterEach(async () => {
    await act(async () => root.unmount());
    document.body.replaceChildren();
});

const show = (...dialogs: Array<[string, () => void]>) =>
    act(async () => {
        root.render(createElement('div', null, ...dialogs.map(([id, onClose]) => createElement(Dialog, { key: id, id, onClose }))));
    });

describe('useModalFocus', () => {
    it('moves focus into the dialog and returns it to the opener on close', async () => {
        await show(['a', vi.fn()]);
        expect(active()).toBe('a-first');
        await act(async () => root.render(createElement('div')));
        expect(active()).toBe('opener');
    });

    it('wraps Tab from the last control to the first, and Shift+Tab back', async () => {
        await show(['a', vi.fn()]);
        document.getElementById('a-last')!.focus();
        expect(press('Tab').defaultPrevented).toBe(true);
        expect(active()).toBe('a-first');
        press('Tab', true);
        expect(active()).toBe('a-last');
    });

    it('pulls focus back in when it has escaped the dialog', async () => {
        await show(['a', vi.fn()]);
        opener.focus();
        press('Tab');
        expect(active()).toBe('a-first');
    });

    it('closes on Escape', async () => {
        const onClose = vi.fn();
        await show(['a', onClose]);
        press('Escape');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('lets only the topmost of two open dialogs react', async () => {
        const lower = vi.fn();
        const upper = vi.fn();
        await show(['lower', lower], ['upper', upper]);
        press('Escape');
        expect(upper).toHaveBeenCalledTimes(1);
        expect(lower).not.toHaveBeenCalled();
    });
});
