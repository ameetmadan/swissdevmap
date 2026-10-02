import { EMPTY_VIEW, ViewState } from './viewUrl';

export interface ExampleView {
    id: string;
    label: string;
    view: ViewState;
}

// Each one is a real question the map answers, and each is expressible in the URL scheme, so
// choosing it also produces a link someone can share.
export const EXAMPLE_VIEWS: ExampleView[] = [
    { id: 'rust', label: 'Which companies use Rust?', view: { ...EMPTY_VIEW, tags: ['Rust'] } },
    { id: 'go-heatmap', label: 'Where is Go most popular?', view: { ...EMPTY_VIEW, heatmapTech: 'Go' } },
    {
        id: 'fintech-python',
        label: 'Fintech companies using Python',
        view: { ...EMPTY_VIEW, tags: ['Python'], types: ['Fintech'] },
    },
    {
        id: 'python-bern',
        label: 'Python within 30 min of Bern',
        view: { ...EMPTY_VIEW, tags: ['Python'], commute: { from: 'Bern', minutes: 30 } },
    },
];
