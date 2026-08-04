import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendHotel from './AmendHotel';

const createMockProps = () => ({
    fields: {
        AlternativeHotelsSubtitle: mockSitecoreField('{number} hotels available'),
        AlternativeHotelsTitle: mockSitecoreField('AlternativeHotelsTitle'),
        ChosenHotelTitle: mockSitecoreField('ChosenHotelTitle'),
        LoadMoreCTA: mockSitecoreField('LoadMoreCTA'),
        Subtitle: mockSitecoreField('Subtitle'),
        Title: mockSitecoreField('Title'),
        ViewHotelCTA: mockSitecoreField('ViewHotelCTA'),
        BookHotelCTA: mockSitecoreField('BookHotelCTA'),
        PriceTooltip: mockSitecoreField('PriceTooltip'),
        PriceHighToLow: mockSitecoreField('PriceHighToLow'),
        PriceLowToHigh: mockSitecoreField('PriceLowToHigh'),
        TripAdvisor: mockSitecoreField('TripAdvisor'),
    },
    rendering: {},
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder'>{props.children}</div>;
    },
    Text: props => <div data-tid={props['data-tid']}>{props.field.value}</div>,
}));

const mockAmendHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageHeader/AmendPageHeader', () => ({
    __esModule: true,
    default: props => {
        mockAmendHeaderProps(props);

        return <div data-tid='amend-header' />;
    },
}));

const mockYourHotelCardProps = jest.fn();
jest.mock('./components/YourHotelCard/YourHotelCard', () => ({
    __esModule: true,
    default: props => {
        mockYourHotelCardProps(props);

        return <div data-tid='your-hotel-card' />;
    },
}));

jest.mock('frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='search-results-loading-skeleton' />,
}));

const mockFloatingPopupProps = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopupProps(props);

        return (
            <div data-tid='floating-popup'>
                <button onClick={props.onClose}>{props.children}</button>
            </div>
        );
    },
}));

const mockOfferCardNewProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardNewProps(props);

        return <div data-tid='offer-card-new' />;
    },
}));

const mockAlternativeHotelsHeaderProps = jest.fn();
jest.mock('./components/AlternativeHotelsHeader/AlternativeHotelsHeader', () => ({
    __esModule: true,
    default: props => {
        mockAlternativeHotelsHeaderProps(props);

        return <div data-tid='alternative-hotels-header' />;
    },
}));

const mockAlternativeHotelsListProps = jest.fn();
jest.mock('./components/AlternativeHotelsList/AlternativeHotelsList', () => ({
    __esModule: true,
    default: props => {
        mockAlternativeHotelsListProps(props);

        return <div data-tid='alternative-hotels-list' />;
    },
}));

jest.mock('frontend/components/renderings/AmendmentBasket/components/HotelBasket/HotelBasket', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-basket' />,
}));

jest.mock('frontend/components/common/AmendHotelStickyHeader/StickyHeader', () => ({
    __esModule: true,
    default: () => <div data-tid='sticky-header' />,
}));

jest.mock('frontend/components/renderings/AmendHotel/components/AmendHotelsFiltersWrap/AmendHotelsFiltersWrap', () => ({
    __esModule: true,
    default: () => <div data-tid='amend-hotels-filters-wrap' />,
}));

const mockOverlaySpinnerProps = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinnerProps(props);

        return <div data-tid='overlay-spinner' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

describe('<AmendHotel />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendHotelStore: {
                initializeHotelChangePage: jest.fn(),
                clearHotelSearchResults: jest.fn(),
            },
            trackingStore: {
                changeHotel: {
                    clearStore: jest.fn(),
                },
            },
        });
    });

    it('should render components', () => {
        render(<AmendHotel {...mockProps} />);

        expect(screen.getByTestId('sticky-header')).toBeInTheDocument();

        expect(screen.getByTestId('amend-header')).toBeInTheDocument();
        expect(mockAmendHeaderProps).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            subtitle: mockProps.fields.Subtitle,
            rendering: mockProps.rendering,
            isAttentionMessageOn: true,
        });

        expect(screen.getByTestId('chosen-hotel-title')).toBeInTheDocument();
        expect(screen.getByTestId('amend-hotels-filters-wrap')).toBeInTheDocument();
        expect(screen.getByTestId('your-hotel-card')).toBeInTheDocument();
        expect(mockYourHotelCardProps).toHaveBeenCalledWith({
            booking: mockStores.viewBookingStore.booking,
            fallbackImage: 'HotelFallbackImage',
        });

        expect(screen.getByTestId('alternative-hotels-header')).toBeInTheDocument();
        expect(mockAlternativeHotelsHeaderProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });

        expect(screen.getByTestId('alternative-hotels-list')).toBeInTheDocument();
        expect(mockAlternativeHotelsListProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            rendering: mockProps.rendering,
            fallbackImage: 'HotelFallbackImage',
        });

        expect(screen.getAllByTestId('placeholder')).toHaveLength(2);
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.UnAvailableFlowPopup,
            rendering: mockProps.rendering,
        });
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.ChangeFeeInfo,
            rendering: mockProps.rendering,
        });
    });

    it('should call clearHotelSearchResults on unmount', () => {
        const { unmount } = render(<AmendHotel {...mockProps} />);

        unmount();

        expect(mockStores.amendHotelStore.clearHotelSearchResults).toHaveBeenCalled();
    });

    it('should NOT render Your Hotel Card if no booking', () => {
        mockStores.viewBookingStore.booking = null;

        render(<AmendHotel {...mockProps} />);

        expect(screen.queryByTestId('your-hotel-card')).not.toBeInTheDocument();
    });

    it('should call initializeHotelChangePage on mount', () => {
        render(<AmendHotel {...mockProps} />);

        expect(mockStores.amendHotelStore.initializeHotelChangePage).toHaveBeenCalledWith(
            mockStores.trackingStore.changeHotel.trackHotelListImpressionEvent,
        );
    });

    it('Should call clearStore for tracking store on mount', () => {
        render(<AmendHotel {...mockProps} />);

        expect(mockStores.trackingStore.changeHotel.clearStore).toHaveBeenCalled();
    });

    it('should render mobile basket on mobile and not sticky header', () => {
        mockUseMobileViewport = true;

        render(<AmendHotel {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.MobileBasket,
                rendering: mockProps.rendering,
                showPrice: false,
                isStaticFooterIncluded: false,
                applyNegativeMargin: true,
            }),
        );
        expect(screen.getByTestId('hotel-basket')).toBeInTheDocument();
        expect(screen.queryByTestId('sticky-header')).not.toBeInTheDocument();
    });

    it('should render OverlaySpinner if isLoadingSummaryPage', () => {
        mockStores.amendHotelStore.isLoadingSummaryPage = true;

        render(<AmendHotel {...mockProps} />);

        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
        expect(mockOverlaySpinnerProps).toHaveBeenCalledWith({
            header: SitecoreDictionary.AmendHotelLabelsValidatingHotel,
        });
    });

    it('should render null if no fields', () => {
        mockProps.fields = null;

        const { container } = render(<AmendHotel {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });
});
