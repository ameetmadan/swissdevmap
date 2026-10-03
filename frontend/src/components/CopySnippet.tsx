import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/share';

const FEEDBACK_MS = 2500;

export default function CopySnippet({ label, text }: { label: string; text: string }) {
    const [feedback, setFeedback] = useState<'copied' | 'failed' | null>(null);
    const timer = useRef<number>();

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const copy = async () => {
        setFeedback(await copyText(text));
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
    };

    const message = feedback === 'copied' ? 'Copied' : feedback === 'failed' ? 'Copy failed, select the text instead' : '';

    return (
        <div className="copy-snippet">
            <div className="copy-snippet-head">
                <span className="copy-snippet-label">{label}</span>
                <button type="button" className="btn-ghost" onClick={copy}>{feedback === 'copied' ? 'Copied' : 'Copy'}</button>
            </div>
            <textarea className="copy-snippet-text" readOnly rows={3} value={text} aria-label={label} onFocus={(e) => e.target.select()} />
            <span role="status" className="visually-hidden">{message}</span>
        </div>
    );
}
