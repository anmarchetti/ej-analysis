import React from 'react';
import { render } from '@testing-library/react';

import DestinationHighlightsCard from './DestinationHighlightsCard';

const createProps = () => ({
    item: {
        fields: {
            Title: { value: 'title' },
            Description: { value: 'description' },
            Image: { value: { src: 'image' } },
        },
        id: 'id',
    },
});

const createStores = () => ({
    layoutStore: {},
    routerStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/MasonryCarousel/MasonryCarousel', () => () => (
    <div data-tid='masonry-carousel' />
));

describe('<DestinationHighlightsCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.item.fields = null;
        const { container } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render image', () => {
        const { getByTestId } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(getByTestId('fallback-image')).toBeInTheDocument();
    });

    it('should NOT render image when no image provided', () => {
        mockProps.item.fields.Image = null;
        const { queryByTestId } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(queryByTestId('fallback-image')).not.toBeInTheDocument();
    });

    it('should render tile', () => {
        const { getByRole } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render tile when no tile provided', () => {
        mockProps.item.fields.Title = null;
        const { queryByRole } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render description', () => {
        const { getByText } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render description when no description provided', () => {
        mockProps.item.fields.Description = null;
        const { queryByText } = render(<DestinationHighlightsCard {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });
});
