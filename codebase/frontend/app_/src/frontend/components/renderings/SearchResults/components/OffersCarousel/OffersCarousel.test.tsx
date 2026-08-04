import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { responsive, responsiveCarouselSlim } from 'frontend/utils/getSlidersToShow';
import SitePath from 'models/enum/SitePath';

import { IOffersCarouselProps, OffersCarousel } from './OffersCarousel';

(window as any).BASEPATH = '';

const mockCarousel = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCarousel(props);

        return <div data-tid='carousel'>{props.children}</div>;
    },
}));

const mockCarouselOfferCard = jest.fn();
jest.mock('../CarouselOfferCard', () => ({
    __esModule: true,
    default: props => {
        mockCarouselOfferCard(props);

        return <div data-tid='carousel-offer-card' />;
    },
}));

jest.mock('../ViewAllHolidays/ViewAllHolidays', () => ({ link }) => <div data-tid='view-all-holidays'>{link}</div>);

const createProps = (): IOffersCarouselProps => ({
    onSelectOffer: jest.fn(),
    fallbackImage: '',
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OffersCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it("should don't render", () => {
        mockStores.hotelsStore.parentOffers = [];

        render(<OffersCarousel {...mockProps} />);

        expect(screen.queryByTestId('parent-destination')).not.toBeInTheDocument();
        expect(screen.queryByTestId('parent-destination-results')).not.toBeInTheDocument();
    });

    it('should render carousel', () => {
        render(<OffersCarousel {...mockProps} />);

        expect(screen.getByTestId('parent-destination')).toBeInTheDocument();
        expect(screen.getByTestId('parent-destination-results')).toBeInTheDocument();
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-offer-card')).toHaveLength(mockStores.hotelsStore.parentOffers!.length);
        expect(mockCarouselOfferCard).toHaveBeenNthCalledWith(1, {
            fallbackImage: '',
            isParentOffer: true,
            offer: mockedOffer,
            offerIndex: 0,
            onSelect: expect.any(Function),
            fields: mockProps.fields,
        });
    });

    it('should render mobile view with ViewAllHolidays without carousel', () => {
        mockStores.appStore.isScreenExtraSmall = true;

        render(<OffersCarousel {...mockProps} />);

        expect(screen.getByTestId('parent-destination')).toBeInTheDocument();
        expect(screen.getByTestId('parent-destination-results')).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-offer-card')).toHaveLength(mockStores.hotelsStore.parentOffers!.length);
        expect(screen.getByTestId('view-all-holidays')).toBeInTheDocument();
        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
    });

    it('should generate correct showMoreLink', () => {
        mockStores.queryParamStore.buildSearchQuery = jest.fn(
            () =>
                '?ibf=true&to=09-08-2024&from=06-08-2024&dst=ESMA&sAccId=&geog=ES,ESMA&flex=0&org=LGW&aa=1&rooms=2&page=1&take=10&orderBy=recommended&orderDirection=default',
        );
        mockStores.searchStore.searchTo.selectedParentDestinationCodesQuery = 'ES';

        render(<OffersCarousel {...mockProps} />);

        const expectedShowMoreLink = `${SitePath.Search}?ibf=true&to=09-08-2024&from=06-08-2024&dst=ES&sAccId=&geog=ES&flex=0&org=LGW&aa=1&rooms=2&page=1&take=10&orderBy=recommended&orderDirection=default`;
        expect(screen.getByTestId('view-all-holidays')).toHaveTextContent(expectedShowMoreLink);
    });

    describe('responsive', () => {
        it('should pass correct responsive prop to Carousel when it is not Promo or SearchResult page', () => {
            render(<OffersCarousel {...mockProps} />);

            expect(mockCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    responsive,
                }),
            );
        });

        it('should pass correct responsive prop to Carousel on Promo page', () => {
            mockStores.layoutStore.isPromoPage = true;
            render(<OffersCarousel {...mockProps} />);

            expect(mockCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    responsive: responsiveCarouselSlim,
                }),
            );
        });

        it('should pass correct responsive prop to Carousel on Search Results page', () => {
            mockStores.layoutStore.isSearchResultsPage = true;
            render(<OffersCarousel {...mockProps} />);

            expect(mockCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    responsive: responsiveCarouselSlim,
                }),
            );
        });
    });
});
