import { ReactNode, useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { shareLink, SharePayload } from '../lib/share';

interface ShareButtonProps {
    surface: 'company' | 'view';
    getPayload: () => SharePayload;
    className: string;
    children?: ReactNode;
}

const FEEDBACK_MS = 2500;

const LABELS = { copied: 'Link copied', failed: 'Copy failed' } as const;

export default function ShareButton({ surface, getPayload, className, children = 'Share' }: ShareButtonProps) {
    const [feedback, setFeedback] = useState<keyof typeof LABELS | null>(null);
    const timer = useRef<number>();

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const handleClick = async () => {
        const outcome = await shareLink(getPayload());
        if (outcome === 'cancelled') return;
        if (outcome !== 'failed') track('share', { surface, method: outcome === 'shared' ? 'native' : 'clipboard' });
        if (outcome === 'copied' || outcome === 'failed') {
            setFeedback(outcome);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
        }
    };

    return (
        <>
            <button type="button" className={className} onClick={handleClick}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
                </svg>
                <span>{feedback ? LABELS[feedback] : children}</span>
            </button>
            <span role="status" className="visually-hidden">{feedback ? LABELS[feedback] : ''}</span>
        </>
    );
}
