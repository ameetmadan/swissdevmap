import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialogs can open above one another (a form over the mobile filter sheet), and only the top one may react.
const openDialogs: HTMLElement[] = [];

/**
 * Makes `panelRef` behave as a modal dialog: focus moves in when it opens (unless something inside
 * already took it), Tab and Shift+Tab stay inside, Escape closes it, and focus returns to what opened it.
 * The listener is on the capture phase and stops the event, so a focus trap underneath never sees it.
 */
export function useModalFocus(panelRef: RefObject<HTMLElement>, onClose: () => void) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const opener = document.activeElement as HTMLElement | null;
        const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

        openDialogs.push(panel);
        if (!panel.contains(document.activeElement)) (focusable()[0] ?? panel).focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (openDialogs[openDialogs.length - 1] !== panel) return;
            if (event.key === 'Escape') {
                event.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (event.key !== 'Tab') return;
            event.stopPropagation();

            const items = focusable();
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (!first || !last) {
                event.preventDefault();
                panel.focus();
            } else if (event.shiftKey && (active === first || !panel.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            openDialogs.splice(openDialogs.indexOf(panel), 1);
            opener?.focus?.();
        };
    }, [panelRef]);
}
