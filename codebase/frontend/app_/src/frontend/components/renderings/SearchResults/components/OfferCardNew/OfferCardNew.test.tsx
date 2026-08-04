import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockTransfer } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import OfferCardNew, { IOfferCardProps } from './OfferCardNew';

const createProps = (): IOfferCardProps => ({
    rendering: '',
    offer: {
        ...mockedOffer,
        price: 500,
    },
    fallbackImage: '',
    offerIndex: 0,
    onSelect: mockOnSelect,
    isSelectedToEdit: false,
    isSelectionEditMode: false,
    hasShortlistBookmark: false,
});

const mockOnSelect = jest.fn();

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenExtraLarge: true,
        },
        routerStore: {
            hotelDetailsUrl: jest.fn(() => 'testHotelLink'),
        },
        layoutStore: {
            isShortlistPage: false,
            isSearchResultsPage: true,
            isPromoPage: false,
            currentPath: 'example',
            isFullScreenEnabledSearchResults: true,
            isFullScreenEnabledPromo: false,
        },
        queryParamStore: {
            buildHotelDetailsQuery: jest.fn(),
            buildBD4HotelParam: jest.fn(),
        },
        searchStore: {
            page: 2,
            take: 2,
        },
        shortlistStore: {
            getShortlistHotelLink: jest.fn(),
        },
    });

const createCompareLocalStore = () => ({
    isOfferSelectedToCompare: jest.fn().mockReturnValue(false),
});

let mockProps;
let mockStores;
let mockLocalStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(x => x),
    addDays: jest.fn(() => 'added'),
    parseDateL10n: jest.fn(() => 'parsed'),
}));

jest.mock('frontend/utils/shortlist.utils', () => ({
    isShortlistOfferUnavailable: jest.fn(() => false),
}));

jest.mock('frontend/utils/urgencyMessage.utils', () => ({
    getRoomsUrgencyMessageVisibility: jest.fn(() => true),
    getRoomsUrgencyMessage: () => 'Urgency message',
}));

jest.mock('frontend/utils/string.utils', () => ({
    getAlphanum: jest.fn(() => 'test_id'),
}));

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => true),
}));

jest.mock('frontend/utils/hotelLink.utils', () => ({
    getHotelLinkWithPrice: jest.fn().mockReturnValue('/testHotelLink?searchPrice=500'),
}));

const mockImageCarouselContainer = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchResults/components/ImageCarouselContainer/ImageCarouselContainer',
    () => ({
        __esModule: true,
        default: props => {
            mockImageCarouselContainer(props);

            return <div data-tid='image-carousel-container' />;
        },
    }),
);

jest.mock('frontend/components/renderings/SearchResults/components/OfferCardOptions', () => ({
    __esModule: true,
    default: () => <div data-tid='offer-card-options' />,
}));

const mockOfferCardFooterComponent = jest.fn();

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardNew/components/OfferCardFooter/OfferCardFooter',
    () => ({
        __esModule: true,
        default: props => {
            mockOfferCardFooterComponent(props);

            return <div data-tid='offer-card-footer' />;
        },
    }),
);

const mockOfferCardHeaderComponent = jest.fn();

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardNew/components/OfferCardHeader/OfferCardHeader',
    () => ({
        __esModule: true,
        default: props => {
            const { onClickSelect, onChangeEditSelection } = props;
            mockOfferCardHeaderComponent(props);

            return (
                <>
                    <div data-tid='offer-card-header' onClick={onClickSelect} />
                    <div data-tid='offer-card-header-change-edit-selection' onClick={onChangeEditSelection} />
                </>
            );
        },
    }),
);

const mockUrgencyMessage = jest.fn();
jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: props => {
        mockUrgencyMessage(props);

        return <div data-tid='urgency-message' />;
    },
}));

let mockUseMobileViewport = true;
const useMoreThenDesktopViewport = false;

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
    useMoreThenDesktopViewport: () => useMoreThenDesktopViewport,
}));

const mockOfferExtrasProps = jest.fn();
jest.mock('frontend/components/renderings/AmendHotel/components/OfferExtras/OfferExtras', () => ({
    __esModule: true,
    default: props => {
        mockOfferExtrasProps(props);

        return <div data-tid='offer-extras' />;
    },
}));

const mockAmendHotelOfferCardFooter = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendHotel/components/AmendHotelOfferCardFooter/AmendHotelOfferCardFooter',
    () => ({
        __esModule: true,
        default: props => {
            mockAmendHotelOfferCardFooter(props);

            return <div data-tid='amend-hotel-offer-card-footer' />;
        },
    }),
);

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

describe('<OfferCardNew />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockLocalStore = createCompareLocalStore();
    });

    it('should standard render', () => {
        render(<OfferCardNew {...mockProps} />);

        expect(screen.getByTestId('offer-card')).toHaveClass('cardWrapper');
        expect(screen.getByTestId('image-carousel-container')).toBeInTheDocument();
        expect(mockImageCarouselContainer).toHaveBeenCalledWith({
            fallbackImage: mockProps.fallbackImage,
            offer: mockProps.offer,
            isFullScreenEnabled: mockStores.layoutStore.isFullScreenEnabledSearchResults,
        });

        expect(screen.getByTestId('offer-card-header')).toBeInTheDocument();
        expect(mockOfferCardHeaderComponent).toHaveBeenCalledWith({
            hotelLink: 'testHotelLink',
            hotelLinkWithPrice: '/testHotelLink?searchPrice=500',
            offer: mockProps.offer,
            rendering: mockProps.rendering,
            routeDep: mockProps.offer.transport.routes[0],
            isOfferUnavailableInShortlist: false,
            isShortlistButton: false,
            onClickSelect: expect.any(Function),
            isInAmendHotelFlow: false,
            onClickViewHoliday: expect.any(Function),
        });

        expect(screen.getByTestId('offer-card-options')).toBeInTheDocument();
        expect(screen.getByTestId('offer-card-footer')).toBeInTheDocument();
        expect(mockOfferCardFooterComponent).toHaveBeenCalledWith({
            hasShortlistBookmark: mockProps.hasShortlistBookmark,
            hotelLink: 'testHotelLink',
            hotelLinkWithPrice: '/testHotelLink?searchPrice=500',
            isSelectionEditMode: mockProps.isSelectedToEdit,
            isShortlistOfferUnavailable: false,
            offer: mockProps.offer,
            rendering: mockProps.rendering,
            routeDep: mockProps.offer.transport.routes[0],
            onClickSelect: expect.any(Function),
            isLuxury: false,
        });
    });

    it('should use isFullScreenEnabledPromo for promoPage', () => {
        mockStores.layoutStore.isPromoPage = true;
        render(<OfferCardNew {...mockProps} />);

        expect(mockImageCarouselContainer).toHaveBeenCalledWith({
            fallbackImage: mockProps.fallbackImage,
            offer: mockProps.offer,
            isFullScreenEnabled: mockStores.layoutStore.isFullScreenEnabledPromo,
        });
    });

    it('should render offer card with card--selected class when isSelectedToEdit is true', () => {
        mockProps.isSelectedToEdit = true;

        render(<OfferCardNew {...mockProps} />);

        expect(screen.getByTestId('offer-card')).toHaveClass('cardWrapper card--selected');
    });

    describe('compare mode', () => {
        it('should render offer card with card--selected class when offer selected to compare', () => {
            mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(true);

            render(<OfferCardNew {...mockProps} />);

            expect(screen.getByTestId('offer-card')).toHaveClass('cardWrapper card--selected');
        });

        it('should not render offer card with card--selected class when offer is not selected to compare', () => {
            render(<OfferCardNew {...mockProps} />);

            expect(screen.getByTestId('offer-card')).not.toHaveClass('card--selected');
        });

        it('should not render offer card with card--selected class when there is no compare store', () => {
            mockLocalStore = null;
            render(<OfferCardNew {...mockProps} />);

            expect(screen.getByTestId('offer-card')).not.toHaveClass('card--selected');
        });
    });

    it('should render urgency message if is mobile viewport', () => {
        render(<OfferCardNew {...mockProps} />);

        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
        expect(mockUrgencyMessage).toHaveBeenCalledWith({
            className: 'urgentPillContent priority',
            message: 'Urgency message',
            tooltip: 'SearchResults.Labels.HurryTooltip',
        });
    });

    it('should NOT render pill if is tablet viewport', () => {
        mockUseMobileViewport = false;

        render(<OfferCardNew {...mockProps} />);

        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        expect(mockUrgencyMessage).not.toHaveBeenCalled();
    });

    it('should NOT render urgency-message for isMobileView, isInAmendHotelFlow prop is true', () => {
        mockUseMobileViewport = true;
        mockProps.isInAmendHotelFlow = true;

        render(<OfferCardNew {...mockProps} />);

        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should select on click select', () => {
        const { getByTestId } = render(<OfferCardNew {...mockProps} />);

        fireEvent.click(getByTestId('offer-card-header'));

        expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should call getShortlistHotelLink to get hotel link on shortlist page', () => {
        mockStores.layoutStore.isShortlistPage = true;
        render(<OfferCardNew {...mockProps} />);

        fireEvent.click(screen.getByTestId('offer-card-header'));

        expect(mockStores.shortlistStore.getShortlistHotelLink).toHaveBeenCalledWith(mockProps.offer);
    });

    it('should build hotel link with fallback params if no other sources found', () => {
        render(<OfferCardNew {...mockProps} />);

        fireEvent.click(screen.getByTestId('offer-card-header'));

        expect(mockStores.queryParamStore.buildHotelDetailsQuery).toHaveBeenCalledWith(
            mockProps.offer,
            expect.not.objectContaining({ from: 'parsed', to: 'added' }),
            expect.objectContaining({ from: 'parsed', to: 'added' }),
        );
    });

    it('should build hotel link with params from search store if not on search results page', () => {
        mockStores.layoutStore.isSearchResultsPage = false;
        render(<OfferCardNew {...mockProps} />);

        fireEvent.click(screen.getByTestId('offer-card-header'));

        expect(mockStores.queryParamStore.buildHotelDetailsQuery).toHaveBeenCalledWith(
            mockProps.offer,
            expect.objectContaining({ from: 'parsed', to: 'added' }),
            expect.objectContaining({ from: 'parsed', to: 'added' }),
        );
    });

    it('should build hotel link with origin and promo params if promo page', () => {
        mockStores.layoutStore.isPromoPage = true;
        render(<OfferCardNew {...mockProps} />);

        fireEvent.click(screen.getByTestId('offer-card-header'));

        expect(mockStores.queryParamStore.buildHotelDetailsQuery).toHaveBeenCalledWith(
            mockProps.offer,
            expect.objectContaining({
                dtransfer: 'TRANSFER_CODE',
                org: ['LGW'],
                promo: 'example',
                transfer: 'TRANSFER_CODE',
            }),
            expect.objectContaining({ from: 'parsed', to: 'added' }),
        );
    });

    describe('isInAmendHotelFlow', () => {
        it('should render OfferExtras, AmendHotelOfferCardFooter and OfferCardHeader with isInAmendHotelFlow prop if is in amend hotel flow', () => {
            mockProps.isInAmendHotelFlow = true;
            mockProps.offer.transfers = [mockTransfer];
            mockProps.hotelOfferCardFields = {
                ViewHotelCTA: mockSitecoreField('View Hotel CTA'),
                BookHotelCTA: mockSitecoreField('Book Hotel CTA'),
                PriceTooltip: mockSitecoreField('Price Tooltip'),
            };
            render(<OfferCardNew {...mockProps} />);

            expect(screen.getByTestId('offer-card-header')).toBeInTheDocument();
            expect(mockOfferCardHeaderComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isInAmendHotelFlow: true }),
            );

            expect(screen.getByTestId('offer-extras')).toBeInTheDocument();
            expect(mockOfferExtrasProps).toHaveBeenCalledWith({
                ecoFacility: mockProps.offer.hotel!.ecoFacility,
                roomType: mockProps.offer.accom.unit[0].roomType,
                boardType: mockProps.offer.accom.unit[0].boardType,
                transfer: mockProps.offer.transfers[0],
                isUrgencyMessageVisible: true,
                avail: 0,
            });

            expect(screen.getByTestId('amend-hotel-offer-card-footer')).toBeInTheDocument();
            expect(mockAmendHotelOfferCardFooter).toHaveBeenCalledWith({
                fields: mockProps.hotelOfferCardFields,
                onSelectHotel: expect.any(Function),
                offer: mockProps.offer,
                amendHotelOffer: {},
            });
            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });

        it('should render ImageCarouselContainer with isFullScreenEnabled prop if is in amend hotel flow', () => {
            mockProps.isInAmendHotelFlow = true;
            render(<OfferCardNew {...mockProps} />);

            expect(screen.getByTestId('image-carousel-container')).toBeInTheDocument();
            expect(mockImageCarouselContainer).toHaveBeenCalledWith({
                fallbackImage: '',
                offer: mockProps.offer,
                isFullScreenEnabled: true,
            });
        });
    });
});
