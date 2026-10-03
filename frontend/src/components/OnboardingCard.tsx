import { usePersistentFlag } from '../hooks/usePersistentFlag';
import ExampleViews from './ExampleViews';

export default function OnboardingCard({ onOpenAbout }: { onOpenAbout: () => void }) {
    const [dismissed, dismiss] = usePersistentFlag('sdm:intro-dismissed');
    if (dismissed) return null;

    return (
        <aside className="onboarding" aria-labelledby="onboarding-title">
            <button type="button" className="onboarding-close" onClick={dismiss} aria-label="Dismiss introduction">×</button>
            <h2 id="onboarding-title">Which Swiss companies use which tech?</h2>
            <p>SwissDevMap maps Swiss tech employers and the technologies they hire for. Try a question:</p>
            <ExampleViews onPick={dismiss} />
            <button type="button" className="onboarding-link" onClick={onOpenAbout}>
                Where does this data come from?
            </button>
        </aside>
    );
}
