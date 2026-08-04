import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';

import OfferCardHeader, { IOfferCardHeaderProps } from './OfferCardHeader';

const createProps = (): IOfferCardHeaderProps => ({
    hotelLink: 'hotelLink',
    hotelLinkWithPrice: 'testLink',
    offer: mockedOffer,
    isOfferUnavailableInShortlist: false,
    onClickSelect: jest.fn(),
    rendering: '',
    routeDep: {
        depDate: '2019-09-16T14:20:00+00:00',
        depName: 'Palma Airport',
        depPt: 'PMI',
        arrDate: '2019-09-16T11:55:00+00:00',
        arrName: 'London Gatwick Airport',
        arrPt: 'LGW',
    } as any,
    isShortlistButton: true,
    onClickViewHoliday: jest.fn(),
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/getHotelLocation', () => ({
    getHotelLocation: jest.fn(),
}));

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: () => <div data-tid='link' />,
}));

const mockStarRatingProps = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingProps(props);

        return <div data-tid='star-rating' />;
    },
}));

const mockTripAdvisorInfoProps = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: props => {
        mockTripAdvisorInfoProps(props);

        return <div data-tid='tripadvisor-info' />;
    },
}));

const mockShortlistButtonProps = jest.fn();
jest.mock('frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton', () => props => {
    mockShortlistButtonProps(props);

    return <div data-tid='shortlist-button' />;
});

jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: () => <div data-tid='checkbox' />,
}));

const mockOfferCardPillsProps = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardNew/components/OfferCardPills/OfferCardPills',
    () => ({
        __esModule: true,
        default: props => {
            mockOfferCardPillsProps(props);

            return <div data-tid='offer-card-pills' />;
        },
    }),
);

let mockUseMoreThenDesktopViewport = true;
let mockUseMoreThenMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMoreThenDesktopViewport: jest.fn(() => mockUseMoreThenDesktopViewport),
    useMoreThenMobileViewport: jest.fn(() => mockUseMoreThenMobileViewport),
}));

const mockOfferCardHotelTitle = jest.fn();
jest.mock('frontend/components/common/OfferCardHotelTitle/OfferCardHotelTitle', () => props => {
    mockOfferCardHotelTitle(props);

    return <div data-tid='hotel-card-head-title' />;
});

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardNew/components/CompareCheckbox/CompareCheckbox',
    () => () => <div data-tid='compare-checkbox' />,
);

describe('<OfferCardHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isEcoCertifiedEnabledOnSearchPage: true,
            },
        });
    });

    it('should standard render', () => {
        mockProps.isOfferUnavailableInShortlist = false;
        const { getByTestId } = render(<OfferCardHeader {...mockProps} />);

        expect(getByTestId('hotel-card-head-title')).toBeInTheDocument();
        expect(getByTestId('offer-card-ratings')).toHaveClass('hotelRatings');
        expect(getByTestId('star-rating')).toBeInTheDocument();
        expect(mockStarRatingProps).toHaveBeenCalledWith({ rating: 4, className: 'dividerRating' });
        expect(screen.getByTestId('tripadvisor-info')).toBeInTheDocument();
        expect(mockTripAdvisorInfoProps).toHaveBeenCalledWith({
            rating: 4.8,
            reviews: 500,
        });
        expect(screen.getByTestId('offer-card-pills')).toBeInTheDocument();
        expect(mockOfferCardPillsProps).toHaveBeenCalledWith({
            offer: mockProps.offer,
            isOfferUnavailableInShortlist: mockProps.isOfferUnavailableInShortlist,
            rendering: mockProps.rendering,
            routeDep: mockProps.routeDep,
            isEcoCertifiedPill: true,
        });
    });

    it('should do NOT render divider class when isTripAdvisorInfo is false', () => {
        mockProps.offer!.hotel!.rating = 0;
        render(<OfferCardHeader {...mockProps} />);
        expect(mockStarRatingProps).toHaveBeenCalledWith({ rating: 4, className: '' });
    });

    it('should render OfferCardPills if isInAmendHotelFlow and isTabletViewport', () => {
        mockUseMoreThenDesktopViewport = false;
        mockUseMoreThenMobileViewport = true;
        mockProps.isInAmendHotelFlow = true;
        render(<OfferCardHeader {...mockProps} />);

        expect(screen.queryByTestId('hotel-card-head-actions')).toBeInTheDocument();
        expect(screen.getByTestId('offer-card-pills')).toBeInTheDocument();
        expect(mockOfferCardPillsProps).toHaveBeenCalledWith({
            offer: mockProps.offer,
            isOfferUnavailableInShortlist: mockProps.isOfferUnavailableInShortlist,
            rendering: mockProps.rendering,
            routeDep: mockProps.routeDep,
            isEcoCertifiedPill: true,
        });
    });

    it('should NOT render OfferCardPills if NOT isInAmendHotelFlow and isTabletViewport', () => {
        mockUseMoreThenMobileViewport = true;
        mockUseMoreThenDesktopViewport = false;
        mockProps.isInAmendHotelFlow = false;
        render(<OfferCardHeader {...mockProps} />);

        expect(screen.queryByTestId('offer-card-pills')).not.toBeInTheDocument();
    });

    it('should NOT render tripadvisor info if hotel data is undefined', () => {
        mockProps.offer.hotel = undefined;
        render(<OfferCardHeader {...mockProps} />);

        expect(screen.queryByTestId('tripadvisor-info')).not.toBeInTheDocument();
    });

    it('should NOT render shortlist button if screen is bigger than extra large', () => {
        mockUseMoreThenDesktopViewport = true;
        render(<OfferCardHeader {...mockProps} />);

        expect(screen.queryByTestId('shortlist-button')).not.toBeInTheDocument();
    });

    it('should render shortlist button if screen is smaller than extra large', () => {
        mockUseMoreThenDesktopViewport = false;
        render(<OfferCardHeader {...mockProps} />);

        expect(screen.getByTestId('shortlist-button')).toBeInTheDocument();
        expect(mockShortlistButtonProps).toHaveBeenCalledWith({ offer: mockProps.offer });
    });

    it('should pass proper pros to OfferCardHotelTitle', () => {
        render(<OfferCardHeader {...mockProps} />);

        expect(mockOfferCardHotelTitle).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: mockProps.offer,
                hotelLink: mockProps.hotelLink,
                hotelLinkWithPrice: mockProps.hotelLinkWithPrice,
                onClick: expect.any(Function),
            }),
        );
    });

    describe('compare label', () => {
        it('should render compare label on desktop', () => {
            mockUseMoreThenDesktopViewport = true;
            render(<OfferCardHeader {...mockProps} />);

            expect(screen.queryByTestId('hotel-card-head-actions')).toBeInTheDocument();
            expect(screen.getByTestId('compare-checkbox')).toBeInTheDocument();
        });

        it('should not render compare label on tablet and mobile', () => {
            mockUseMoreThenDesktopViewport = false;
            render(<OfferCardHeader {...mockProps} />);

            expect(screen.queryByTestId('compare-checkbox')).not.toBeInTheDocument();
        });
    });

    it('should not render header actions when not desktop viewport and eco facility is not rendered', () => {
        mockUseMoreThenDesktopViewport = false;
        mockProps.isInAmendHotelFlow = false;
        render(<OfferCardHeader {...mockProps} />);

        expect(screen.queryByTestId('hotel-card-head-actions')).not.toBeInTheDocument();
    });
});
