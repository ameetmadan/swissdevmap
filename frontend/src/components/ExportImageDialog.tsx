import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { exportFilename } from '../lib/exportGeometry';
import { renderExportImage } from '../lib/exportImage';
import { captureMapSnapshot } from '../lib/mapSnapshot';
import { viewMeta } from '../lib/pageMeta';
import { viewKey } from '../lib/viewUrl';
import { selectView, useMapStore } from '../store/mapStore';

type State =
    | { status: 'rendering' }
    | { status: 'ready'; url: string; file: File; title: string; canShare: boolean }
    | { status: 'error' };

const plural = (count: number) => `${count} ${count === 1 ? 'company' : 'companies'}`;

function describeCurrentView() {
    const state = useMapStore.getState();
    const view = selectView(state);
    const visible = state.companies.filter((c) => !state.commuteFrom || state.commuteCompanyIds.includes(c.id)).length;
    const { title } = viewMeta(view, null).image;
    const heat = view.heatmapTech && (view.tags.length || view.types.length || view.commute)
        ? ` · ${view.heatmapTech} heatmap`
        : '';
    return {
        title,
        subtitle: `${plural(visible)}${heat}`,
        link: `${window.location.host}/${viewKey(view)}`,
        heatmapTech: view.heatmapTech,
        commuteActive: view.commute !== null,
    };
}

export default function ExportImageDialog({ onClose }: { onClose: () => void }) {
    const [state, setState] = useState<State>({ status: 'rendering' });
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;

        (async () => {
            try {
                const snapshot = captureMapSnapshot();
                // Tiles that failed to load (offline, or blocked from cross-origin use) are skipped by the
                // snapshot, and an image of an empty map is worse than an error.
                if (!snapshot || snapshot.tiles.length === 0) throw new Error('The map is not ready');
                const info = describeCurrentView();
                const blob = await renderExportImage(snapshot, info);
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                const file = new File([blob], exportFilename(info.title), { type: 'image/png' });
                setState({
                    status: 'ready',
                    url: objectUrl,
                    file,
                    title: info.title,
                    canShare: !!navigator.canShare?.({ files: [file] }),
                });
            } catch (error) {
                console.error(error);
                if (!cancelled) setState({ status: 'error' });
            }
        })();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, []);

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            opener?.focus();
        };
    }, [onClose]);

    const shareFile = async () => {
        if (state.status !== 'ready') return;
        try {
            await navigator.share({ files: [state.file], title: state.title });
        } catch {
            /* a dismissed share sheet is not an error */
        }
    };

    return createPortal(
        <div className="dialog-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className="dialog-panel dialog-panel--wide" role="dialog" aria-modal="true" aria-labelledby="export-title">
                <button ref={closeRef} type="button" className="dialog-close" onClick={onClose} aria-label="Close">×</button>
                <h2 id="export-title">Export image</h2>

                {state.status === 'rendering' && <p role="status" className="export-note">Rendering the map…</p>}

                {state.status === 'error' && (
                    <p role="alert" className="export-note">
                        Couldn’t create the image. The map tiles may have been blocked from export; try again after the
                        map has finished loading.
                    </p>
                )}

                {state.status === 'ready' && (
                    <>
                        <img className="export-preview" src={state.url} alt="Preview of the exported map image" />
                        <div className="export-actions">
                            <a className="btn-primary" href={state.url} download={state.file.name}>Download PNG</a>
                            {state.canShare && (
                                <button type="button" className="btn-ghost" onClick={shareFile}>Share image</button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}
