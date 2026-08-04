import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { FeaturedDestinations } from './FeaturedDestinations';

const mockFeaturedDestinationCardRender = jest.fn();

jest.mock('./FeaturedDestinationCard', () =>
    jest.fn(({ item, onItemLinkClick }) => {
        mockFeaturedDestinationCardRender({ item, onItemLinkClick });

        return (
            <div data-tid={`featured-card-${item.id}`}>
                <span data-tid={`featured-card-title-${item.id}`}>{item.fields.Title.value}</span>
                <button data-tid={`featured-card-link-${item.id}`} onClick={onItemLinkClick}>
                    View {item.fields.Title.value}
                </button>
            </div>
        );
    }),
);

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () =>
    createMockStores({
        layoutStore: {
            isLivePriceEnabled: true,
            isTouristTaxEnabled: true,
        },
    });

const createProps = () => ({
    items: [
        { fields: { Title: { value: 'Item-1' } }, id: '1' },
        { fields: { Title: { value: 'Item-2' } }, id: '2', isLivePriceValid: true },
        { fields: { Title: { value: 'Item-3' } }, id: '3' },
    ],
    onItemLinkClick: jest.fn(),
});

let mockStores;
let props;

describe('<FeaturedDestinations />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render the correct number of destination cards with their titles', () => {
        render(<FeaturedDestinations {...props} />);

        const cards = screen.getAllByTestId(/^featured-card-[^-]$/);
        expect(cards).toHaveLength(props.items.length);
    });

    it('should pass the correct props to last card', () => {
        render(<FeaturedDestinations {...props} />);

        expect(mockFeaturedDestinationCardRender).toHaveBeenCalledTimes(props.items.length);
        expect(mockFeaturedDestinationCardRender.mock.calls[props.items.length - 1][0].item).toEqual(props.items[2]);
    });

    it('should render nothing if items array is empty', () => {
        props.items = [];

        render(<FeaturedDestinations {...props} />);

        expect(screen.queryAllByTestId(/featured-card-/)).toHaveLength(0);
    });

    describe('Tourist Tax Tooltip', () => {
        it('should render tax info when isTouristTaxEnabled and isLivePriceEnabled are true', () => {
            render(<FeaturedDestinations {...props} />);

            expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
        });

        it('should NOT render tax info when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;
            render(<FeaturedDestinations {...props} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render tax info when isLivePriceEnabled is false', () => {
            mockStores.layoutStore.isLivePriceEnabled = false;
            render(<FeaturedDestinations {...props} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });
    });
});
