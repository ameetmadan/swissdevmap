import { EMPTY_VIEW } from '../lib/viewUrl';
import { useMapStore } from '../store/mapStore';
import ExampleViews from './ExampleViews';

export default function EmptyResults() {
    const setView = useMapStore((state) => state.setView);

    return (
        <div className="empty-results" role="status">
            <h2>No companies match this view</h2>
            <p>Try removing a filter, or start from one of these:</p>
            <ExampleViews />
            <button type="button" className="btn-primary" onClick={() => setView(EMPTY_VIEW)}>
                Clear all filters
            </button>
        </div>
    );
}
