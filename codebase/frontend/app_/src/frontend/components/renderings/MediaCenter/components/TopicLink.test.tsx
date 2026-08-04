import React from 'react';
import { render, screen } from '@testing-library/react';

import TopicLink from './TopicLink';

const createProps = () => ({
    topic: 'topic',
    className: 'test-class',
    children: <div data-tid='children'>children</div>,
});

const createStores = () => ({
    mediaCenterStore: { redirectToArticlesByTopic: jest.fn() },
    routerStore: { mediaPressReleasesUrl: jest.fn(() => 'link') },
    layoutStore: {},
});

const mockLinkOnClick = jest.fn();
jest.mock(
    'frontend/components/common/Link',
    () =>
        ({ href, children }: { children: React.ReactElement; href: string }) =>
            (
                <a href={href} onClick={mockLinkOnClick} data-testid='mock-common-link'>
                    {children}
                </a>
            ),
);

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TopicLink />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render a link with the correct href and children', () => {
        render(<TopicLink {...props} />);

        const linkElement = screen.getByRole('link', { name: 'children' });

        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('href', `link`);
        expect(mockStores.routerStore.mediaPressReleasesUrl).toHaveBeenCalledWith(props.topic);
    });
});
