import React, { RefObject } from 'react';
import { render } from '@testing-library/react';

import settings from 'code/settings';
import { IOffer } from 'models/data/IOffer';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import OffersPerPage, { IOffersPerPageProps } from './OffersPerPage';

const createStores = () => ({
    layoutStore: {
        getSetting: jest.fn(),
        isPromoPage: false,
    },
    searchStore: {
        take: 10,
        selectedOfferIndex: -1,
    },
    hotelsStore: {
        numberOfHotels: 0,
    },
    trackingStore: {
        trackSearchProductClick: jest.fn(),
    },
    shortlistStore: {
        isShortlistEnabled: true,
    },
});

const resetMocks = (): IOffersPerPageProps => ({
    offers: [
        { id: '0' },
        {
            id: '1',
            promotion: {
                icon: 'promo-icon.jpg',
                bannerTitle: 'Summer Sale Now On',
                minimumSpend1: '£100 off holidays over £800',
                minimumSpend2: '£150 off holidays over £1000',
                minimumSpend3: '£200 off holidays over £1500',
                promoCode: 'SUMMERSALE',
                date: 'Travel between 01/07/22 - 31/08/22',
                tandCs: 'T&C Apply',
                cardDescription: '<div data-tid="test-id">test</div>',
            },
        },
        {
            id: '2',
            promotion: {
                icon: 'promo-icon.jpg',
                bannerTitle: 'Summer Sale Now On 2',
                minimumSpend1: '£100 off holidays over £800',
                minimumSpend2: '£150 off holidays over £1000',
                minimumSpend3: '£200 off holidays over £1500',
                promoCode: 'SUMMERSALE',
                date: 'Travel between 01/07/22 - 31/08/22',
                tandCs: 'T&C Apply',
                cardDescription: '<div data-tid="test-id">test</div>',
            },
        },
    ] as IOffer[],
    rendering: {} as any,
    page: 1,
    onSetSelectedOfferIndex: jest.fn(),
    offerCardBySelectedIndex: {} as RefObject<HTMLDivElement>,
    alternativeFlightsSortOrders: [
        {
            label: 'Price: high to low',
            value: AlternativeFlightsSortBy.PriceHightToLow,
        },
    ],
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy.PriceLowToHigh,
});

let mockStores = createStores();
let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchResults/components/SitecorePlaceholders/PromoStripe', () => () => (
    <div data-tid='promo-stripe' />
));

const mockOfferCard = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew', () => ({
    __esModule: true,
    default: props => {
        mockOfferCard(props);

        return <div data-tid='offer-card'> </div>;
    },
}));

describe('<OffersPerPage />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    settings.Default.PromoStripeIndex = 2;

    it('Should render Promo Stripe on configured position', () => {
        mockStores.hotelsStore.numberOfHotels = 3;
        mocks.rendering = { placeholders: { [PlaceholderNames.PromoStripe]: [{ params: { IndexPosition: '3' } }] } };

        const { container, getByTestId } = render(<OffersPerPage {...mocks} />);
        const promoStripe = getByTestId('promo-stripe');

        expect(promoStripe).toBeInTheDocument();
        expect(container.childNodes[2]).toEqual(promoStripe);
    });

    it('Should render Promo Stripe on default position', () => {
        mockStores.hotelsStore.numberOfHotels = 3;
        mocks.rendering = { placeholders: { [PlaceholderNames.PromoStripe]: [{ params: null }] } };

        const { container, getByTestId } = render(<OffersPerPage {...mocks} />);
        const promoStripe = getByTestId('promo-stripe');

        expect(promoStripe).toBeInTheDocument();
        expect(container.childNodes[settings.Default.PromoStripeIndex - 1]).toEqual(promoStripe);
    });

    it('Should render Promo Stripe on each page', () => {
        mockStores.hotelsStore.numberOfHotels = 6;
        mockStores.searchStore.take = 3;
        mocks.rendering = { placeholders: { [PlaceholderNames.PromoStripe]: [{ params: null }] } };

        const { container, getAllByTestId } = render(<OffersPerPage {...mocks} />);
        const promoStripe = getAllByTestId('promo-stripe');

        expect(container.childNodes[settings.Default.PromoStripeIndex - 1]).toEqual(promoStripe[0]);
        expect(container.childNodes[mockStores.searchStore.take + settings.Default.PromoStripeIndex]).toEqual(
            promoStripe[1],
        );
    });

    it('Should NOT render Promo Stripe if configured position greater then number of offers', () => {
        mockStores.hotelsStore.numberOfHotels = 3;
        mocks.rendering = { placeholders: { [PlaceholderNames.PromoStripe]: [{ params: { IndexPosition: '5' } }] } };

        const { queryByTestId } = render(<OffersPerPage {...mocks} />);
        const promoStripe = queryByTestId('promo-stripe');

        expect(promoStripe).not.toBeInTheDocument();
    });

    it('Should NOT render Promo Stripe if there is not rendering', () => {
        mockStores.hotelsStore.numberOfHotels = 2;
        mocks.rendering = { placeholders: {} };

        const { queryByTestId } = render(<OffersPerPage {...mocks} />);
        const promoStripe = queryByTestId('promo-stripe');

        expect(promoStripe).not.toBeInTheDocument();
    });

    it('should render offer card', () => {
        const { getAllByTestId } = render(<OffersPerPage {...mocks} />);

        expect(getAllByTestId('offer-card')).toHaveLength(3);
        expect(mockOfferCard).toHaveBeenNthCalledWith(1, {
            alternativeFlightsDefaultSort: mocks.alternativeFlightsDefaultSort,
            alternativeFlightsSortOrders: mocks.alternativeFlightsSortOrders,
            cardRef: undefined,
            fallbackImage: undefined,
            hasShortlistBookmark: mockStores.shortlistStore.isShortlistEnabled,
            offer: { id: '0' },
            offerIndex: 0,
            onSelect: expect.any(Function),
            rendering: {},
        });
    });
});
