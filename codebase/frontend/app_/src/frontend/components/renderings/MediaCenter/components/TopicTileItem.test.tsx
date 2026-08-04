import * as React from 'react';
import { render, screen } from '@testing-library/react';

import TopicTileItem from './TopicTileItem';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='mock-jss-text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/JSSImage', () =>
    jest.fn((props: { field: { value?: { alt?: string; src?: string } } }) => (
        <img
            data-testid='mock-jss-image'
            src={props.field?.value?.src || 'mock-src'}
            alt={props.field?.value?.alt || 'mock jss image'}
        />
    )),
);

jest.mock('./TopicLink', () =>
    jest.fn(({ topic, className, children }: { children: React.ReactNode; topic: string; className?: string }) => (
        <a href={`/mock-topic/${topic}`} className={className} data-tid='mock-topic-link'>
            {children}
        </a>
    )),
);

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn((src: string, params: any) => `${src}?mockParams=${JSON.stringify(params)}`),
    },
}));

jest.mock('models/data/MediaSizeParams', () => ({
    getMediaSizeParams: jest.fn(),
    MediaSize: jest.requireActual('models/data/MediaSizeParams').MediaSize,
}));

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
    },
    queryParamStore: {
        buildMediaCenterUrl: jest.fn(),
    },
    mediaCenterStore: {
        redirectToArticlesByTopic: jest.fn(),
    },
});

const createProps = () =>
    ({
        fields: {
            name: 'name',
            Image: {
                value: {
                    src: '/-/jssmedia/7767779c074d40299dfa92854ab4c843.ashx',
                },
            },
            Title: {
                value: 'Title',
            },
            Topic: {
                fields: {
                    Name: {
                        value: 'Specific Title',
                    },
                },
            },
        },
    } as any);

let mockStores = createStores();
let props = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TopicTileItem />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
    });

    it('should return null if fields are not provided', () => {
        const { container } = render(<TopicTileItem {...props} fields={null as any} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render title and background when not in edit mode', () => {
        mockStores.layoutStore.isEditMode = false;

        const { container } = render(<TopicTileItem {...props} />);

        const titleHeading = screen.getByRole('heading', { level: 3 });
        expect(titleHeading).toHaveClass('topic-tiles__item-title');
        expect(screen.getByTestId('mock-jss-text')).toHaveTextContent('Title');

        const backgroundDiv = container.querySelector('.background');
        expect(backgroundDiv).toBeInTheDocument();
        expect(backgroundDiv).not.toHaveClass('exp-editor-bg-image');
        expect(jest.requireMock('models/data/MediaSizeParams').getMediaSizeParams).toHaveBeenCalled();
    });
});
