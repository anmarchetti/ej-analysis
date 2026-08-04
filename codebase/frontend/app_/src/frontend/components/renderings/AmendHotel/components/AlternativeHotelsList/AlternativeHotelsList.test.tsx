import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendHotelOffer } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AlternativeHotelsList from './AlternativeHotelsList';

const createMockProps = () => ({
    fields: {
        LoadMoreCTA: mockSitecoreField('LoadMoreCTA'),
        ViewHotelCTA: mockSitecoreField('ViewHotelCTA'),
        BookHotelCTA: mockSitecoreField('BookHotelCTA'),
        PriceTooltip: mockSitecoreField('PriceTooltip'),
        EmptyListDescription: mockSitecoreField('EmptyListDescription'),
        EmptyListIcon: mockSitecoreField(mockSitecoreImageField('EmptyListIcon')),
        EmptyListTitle: mockSitecoreField('EmptyListTitle'),
    },
    rendering: {},
    fallbackImage: 'HotelFallbackImage',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => <div data-tid={props['data-tid']}>{props.field.value}</div>,
}));

const mockEmptyBlockProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/NoResultsErrorBlock/NoResultsErrorBlock', () => ({
    __esModule: true,
    default: props => {
        mockEmptyBlockProps(props);

        return <div data-tid='empty-block' />;
    },
}));

const mockSearchResultsLoadingSkeletonProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton', () => ({
    __esModule: true,
    default: props => {
        mockSearchResultsLoadingSkeletonProps(props);

        return <div data-tid='search-results-loading-skeleton' />;
    },
}));

const mockOfferCardNewProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardNewProps(props);

        return (
            <div data-tid='offer-card-new'>
                <button onClick={props.onSelect} data-tid='offer-card-select' />
            </div>
        );
    },
}));

describe('<AlternativeHotelsList />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendHotelStore: {
                alternativeHotels: [mockAmendHotelOffer, mockAmendHotelOffer],
                getNextPageOfHotels: jest.fn(),
                totalNumberOfHotels: 2,
                hasMoreHotelsToLoad: true,
                selectNewHotel: jest.fn(),
            },
        });
    });

    describe('Empty block', () => {
        it('should render block when no isLoadingAlternativeHotels and no alternativeHotels', () => {
            mockStores.amendHotelStore.isLoadingAlternativeHotels = false;
            mockStores.amendHotelStore.alternativeHotels = [];

            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.getByTestId('empty-block')).toBeInTheDocument();
            expect(mockEmptyBlockProps).toHaveBeenCalledWith({
                icon: mockProps.fields.EmptyListIcon.value.src,
                title: mockProps.fields.EmptyListTitle.value,
                description: mockProps.fields.EmptyListDescription.value,
            });
        });

        it('should NOT render block when isLoadingAlternativeHotels is true and no alternativeHotels', () => {
            mockStores.amendHotelStore.isLoadingAlternativeHotels = true;
            mockStores.amendHotelStore.alternativeHotels = [];

            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.queryByTestId('empty-block')).not.toBeInTheDocument();
        });

        it('should NOT render block when isLoadingAlternativeHotels is false and alternativeHotels exist', () => {
            mockStores.amendHotelStore.isLoadingAlternativeHotels = false;
            mockStores.amendHotelStore.alternativeHotels = [mockAmendHotelOffer];

            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.queryByTestId('empty-block')).not.toBeInTheDocument();
        });
    });

    it('should render components', () => {
        render(<AlternativeHotelsList {...mockProps} />);

        expect(screen.getAllByTestId('offer-card-new')).toHaveLength(2);
        expect(mockOfferCardNewProps).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: expect.objectContaining({
                    altBoards: [],
                    date: mockStores.viewBookingStore.booking.package.accom.startDate,
                    hasDistressedFlights: false,
                    id: mockAmendHotelOffer.accom.id,
                    price: mockAmendHotelOffer.amendmentChargesInfo?.fullAmendmentCharges,
                    pricePP: 0,
                    stay: mockAmendHotelOffer.accom.stay,
                    transport: mockStores.viewBookingStore.booking.package.transport,
                    touristTax: 0,
                    touristTaxPP: 0,
                    hasDiscountedBoardUpgrade: false,
                    ...mockAmendHotelOffer,
                }),
                fallbackImage: 'HotelFallbackImage',
                offerIndex: expect.any(Number),
                onSelect: expect.any(Function),
                rendering: mockProps.rendering,
                isInAmendHotelFlow: true,
                hotelOfferCardFields: {
                    ViewHotelCTA: mockProps.fields.ViewHotelCTA,
                    BookHotelCTA: mockProps.fields.BookHotelCTA,
                    PriceTooltip: mockProps.fields.PriceTooltip,
                },
            }),
        );

        expect(screen.getByRole('button', { name: mockProps.fields.LoadMoreCTA.value })).toBeInTheDocument();
    });

    it('should call selectNewHotel on OfferCardNew select', async () => {
        render(<AlternativeHotelsList {...mockProps} />);

        await userEvent.click(screen.getAllByTestId('offer-card-select')[0]);

        expect(mockStores.amendHotelStore.selectNewHotel).toHaveBeenCalledWith(mockAmendHotelOffer);
        expect(mockStores.trackingStore.changeHotel.clickBookHotel).toHaveBeenCalledWith(mockAmendHotelOffer);
    });

    it('should NOT render OfferCards if offer is incomplete', async () => {
        mockStores.amendHotelStore.alternativeHotels.forEach(hotel => {
            hotel.accom = null;
        });

        render(<AlternativeHotelsList {...mockProps} />);

        expect(screen.queryByTestId('offer-card-new')).not.toBeInTheDocument();
    });

    it('should NOT render OfferCards if no alternative hotels', () => {
        mockStores.amendHotelStore.alternativeHotels = [];

        render(<AlternativeHotelsList {...mockProps} />);

        expect(screen.queryByTestId('offer-card-new')).not.toBeInTheDocument();
    });

    it('should render loading skeleton if loading alternative hotels', () => {
        mockStores.amendHotelStore.isLoadingAlternativeHotels = true;

        render(<AlternativeHotelsList {...mockProps} />);

        expect(screen.getByTestId('search-results-loading-skeleton')).toBeInTheDocument;
        expect(mockSearchResultsLoadingSkeletonProps).toHaveBeenCalledWith({
            hideHeader: true,
            hidePaginationShimmer: true,
        });
    });

    describe('Load more CTA', () => {
        it('should render in loading state if loading next page', () => {
            mockStores.amendHotelStore.isLoadingNextPage = true;

            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.getByTestId('alt-hotels-list-more-btn')).toHaveClass('btn--loading');
        });

        it('should call getNextPageOfHotels on click', () => {
            render(<AlternativeHotelsList {...mockProps} />);

            screen.getByRole('button', { name: mockProps.fields.LoadMoreCTA.value }).click();

            expect(mockStores.trackingStore.changeHotel.clickLoadMoreAmendHotelList).toHaveBeenCalled();
            expect(mockStores.amendHotelStore.getNextPageOfHotels).toHaveBeenCalledTimes(1);
        });

        it('should disable button on isLoadingAlternativeHotels', () => {
            mockStores.amendHotelStore.isLoading = true;
            mockStores.amendHotelStore.isLoadingAlternativeHotels = true;
            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.getByRole('button', { name: mockProps.fields.LoadMoreCTA.value })).toBeDisabled();
        });

        it('should NOT render if no more hotels to load', () => {
            mockStores.amendHotelStore.hasMoreHotelsToLoad = false;
            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.queryByText(mockProps.fields.LoadMoreCTA.value)).not.toBeInTheDocument();
        });

        it('should render if no more hotels to load but it is loading', () => {
            mockStores.amendHotelStore.hasMoreHotelsToLoad = false;
            mockStores.amendHotelStore.isLoading = true;
            render(<AlternativeHotelsList {...mockProps} />);

            expect(screen.getByRole('button', { name: mockProps.fields.LoadMoreCTA.value })).toBeInTheDocument();
        });
    });
});
