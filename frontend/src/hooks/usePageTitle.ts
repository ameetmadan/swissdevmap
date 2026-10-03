import { useEffect } from 'react';
import { useMatch } from 'react-router-dom';
import { viewTitle } from '../lib/pageMeta';
import { selectView, useMapStore } from '../store/mapStore';

// Tab titles, history entries and bookmarks should say what the view shows. The company modal
// owns the title while it is open, so this only writes on the map routes.
export function usePageTitle() {
    const onCompanyRoute = useMatch('/company/:id') !== null;
    const title = useMapStore((state) => viewTitle(selectView(state)));

    useEffect(() => {
        if (!onCompanyRoute) document.title = title;
    }, [onCompanyRoute, title]);
}
