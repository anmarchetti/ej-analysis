import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { IComparisonTableFields } from 'models/data/IComparison';

import ComparisonTable from './ComparisonTable';

const mockShortlistOfferIdentifier = 'mockShortlistOfferIdentifier';
jest.mock('frontend/utils/tracking/comparisonTable.utils', () => ({
    __esModule: true,
    getShortlistOfferIdentifier: jest.fn(() => mockShortlistOfferIdentifier),
}));

const mockIsShortlistOfferUnavailable = false;
jest.mock('frontend/utils/shortlist.utils', () => ({
    __esModule: true,
    isShortlistOfferUnavailable: jest.fn(() => mockIsShortlistOfferUnavailable),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPriceItem',
    () =>
        ({ pricePPExcludingTouristTax }) =>
            <div data-tid='offer-card-price-item'>{pricePPExcludingTouristTax}</div>,
);

jest.mock('./components/DynamicCell/DynamicCell', () => () => <div data-tid='dynamic-cell' />);

const mockOfferPriceButtonProps = jest.fn();
const mockButtonLabel = 'mockButtonLabel';
jest.mock('./components/CompareOfferButton/CompareOfferButton', () => props => {
    mockOfferPriceButtonProps(props);

    return <button data-tid='compare-offer-button' onClick={e => props.onClickViewHoliday(e, mockButtonLabel)} />;
});

const mockHotelImageProps = jest.fn();
jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageProps(props);

        return <div data-tid='hotel-image' />;
    },
}));

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

let mockProps;
let mockStores;
let mockLocalStore;

const createProps = (): IComparisonTableFields => ({
    ComparisonCriteria: [
        {
            id: '2f41e01e-f710-47d2-af7d-7d244c0aba83',
            fields: {
                Name: {
                    value: 'Distance to nearest attraction',
                },
                Type: {
                    value: 'Location',
                },
                MissingDataLabel: {
                    value: 'Empty Data',
                },
            },
        },
    ],
    FallbackLabel: {
        value: '—',
    },
});
const createMockLocalStore = () => ({
    comparisonList: [mockedOffer],
    updateComparisonList: jest.fn(),
    closeCompareOverlay: jest.fn(),
    hasMinItemsToCompare: true,
});

describe('CompareTable', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockLocalStore = createMockLocalStore();
    });

    describe('title', () => {
        it('should render title', () => {
            render(<ComparisonTable {...mockProps} />);

            expect(screen.getByTestId('hotel-name')).toHaveTextContent('Hotel Example');
        });

        it('should render empty cell when no title', () => {
            mockLocalStore.comparisonList[0].hotel.name = undefined;
            render(<ComparisonTable {...mockProps} />);

            expect(screen.getByTestId('hotel-name')).toBeEmptyDOMElement();
        });
    });

    it('should remove offer from comparison after click on remove button', async () => {
        render(<ComparisonTable {...mockProps} />);

        await userEvent.click(screen.getByTestId('remove-hotel'));

        expect(mockLocalStore.updateComparisonList).toHaveBeenCalledWith(mockedOffer);
    });

    it('should close overlay when hasMinItemsToCompare becomes false', () => {
        const { rerender } = render(<ComparisonTable {...mockProps} />);

        mockLocalStore.hasMinItemsToCompare = false;

        rerender(<ComparisonTable {...mockProps} />);

        expect(mockLocalStore.closeCompareOverlay).toHaveBeenCalled();
    });

    describe('price', () => {
        beforeEach(() => {
            mockLocalStore.comparisonList = [{ ...mockedOffer, livePrice: null }];
        });

        it('should render price when no live price', () => {
            mockLocalStore.comparisonList[0].pricePPExcludingTouristTax = 200;
            render(<ComparisonTable {...mockProps} />);

            expect(screen.getByTestId('offer-card-price-item')).toHaveTextContent('200');
        });

        it('should render live price when it exist', () => {
            mockLocalStore.comparisonList[0].livePrice = { pricePPExcludingTouristTax: 300 };
            render(<ComparisonTable {...mockProps} />);

            expect(screen.getByTestId('offer-card-price-item')).toHaveTextContent('300');
        });

        it('should render empty cell when no current and live price', () => {
            mockLocalStore.comparisonList[0].pricePPExcludingTouristTax = undefined;
            render(<ComparisonTable {...mockProps} />);

            expect(screen.queryByTestId('offer-card-price-item')).not.toBeInTheDocument();
        });
    });

    describe('image', () => {
        it('should render image', () => {
            render(<ComparisonTable {...mockProps} />);

            expect(mockHotelImageProps).toHaveBeenCalledWith({
                className: 'image',
                fallbackImage: 'HotelFallbackImage',
                image: mockedOffer.hotel!.images[0],
            });
        });

        it('should render image with empty strings to call fallback when no hotel', () => {
            mockLocalStore.comparisonList[0].hotel = undefined;
            render(<ComparisonTable {...mockProps} />);

            expect(mockHotelImageProps).toHaveBeenCalledWith({
                className: 'image',
                fallbackImage: 'HotelFallbackImage',
                image: {
                    small: '',
                    medium: '',
                    large: '',
                },
            });
        });
    });

    it('should render button', () => {
        render(<ComparisonTable {...mockProps} />);

        expect(mockOfferPriceButtonProps).toHaveBeenCalledWith({
            offer: mockedOffer,
        });
    });
});
