import { EXAMPLE_VIEWS, ExampleView } from '../lib/examples';
import { useMapStore } from '../store/mapStore';

export default function ExampleViews({ onPick }: { onPick?: () => void }) {
    const setView = useMapStore((state) => state.setView);

    const pick = (example: ExampleView) => {
        setView(example.view);
        onPick?.();
    };

    return (
        <ul className="example-views">
            {EXAMPLE_VIEWS.map((example) => (
                <li key={example.id}>
                    <button type="button" className="example-view" onClick={() => pick(example)}>
                        {example.label}
                    </button>
                </li>
            ))}
        </ul>
    );
}
