import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockAncillariesParams } from 'frontend/__mocks__/ancillaries';
import { HoldLuggageCategory } from 'models/enum/HoldLuggage';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import { mockHoldLuggageFields } from './__mocks__/mockHoldLuggageFields';
import { HoldLuggage, IHoldLuggageProps } from './HoldLuggage';

jest.mock('frontend/components/renderings/HoldLuggage/hooks/useLuggageItems', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue([1, 2, 3, 4]),
}));

const createProps = (): IHoldLuggageProps => ({
    fields: mockHoldLuggageFields,
    params: mockAncillariesParams,
    adultsAndChildrenNumber: 2,
    infantsNumber: 0,
    rendering: undefined,
});

const createStores = () =>
    createMockStores({
        guestDetailsStore: {
            adultsAndChildrenNumber: 2,
            infants: [{ value: 'infant 1' }],
        },
        bookingStore: {
            isFlightExtrasFailed: false,
            extraLuggage: {
                canAddHoldLuggage: true,
                bookingExtras: ['extra1', 'extra2'],
                luggagePrices: 'luggagePrices',
                luggageTypes: {
                    bag1: { categoryCode: 'BAGE', categoryType: HoldLuggageCategory.Bag },
                },
                luggageSelectionFromUrl: 'luggage',
                sportEquipmentSelectionFromUrl: 'sport',
                defaultBagsNumber: 1,
                existingExtraLuggageItemsNumber: 5,
                setHBGreenPromoShown: jest.fn(),
            },
            isFlightExternal: true,
            holdLuggage: {
                initializeHoldLuggage: jest.fn(),
            },
        },
        viewBookingStore: {
            isFlightExtrasFailed: false,
        },
        layoutStore: {
            maxNumberOfAdditionalLuggage: 2,
            maxNumberOfSportEquipments: 1,
            largeSportEquipmentCategoryCode: 'SEO',
            maxNumberOfLargeSportsEquipment: 6,
            isExtrasPage: false,
        },
        appStore: {
            isLoading: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHoldLuggageSelected = jest.fn();
jest.mock('./components/HoldLuggageSelected/HoldLuggageSelected', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageSelected(props);

        return <div data-tid='hold-luggage-selected' />;
    },
}));

const mockHoldLuggageExtras = jest.fn();
jest.mock('./components/HoldLuggageExtras/HoldLuggageExtras.tsx', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageExtras(props);

        return <div data-tid='hold-luggage-extras' />;
    },
}));

const mockHoldLuggageHeader = jest.fn();
jest.mock('./components/HoldLuggageHeader/HoldLuggageHeader.tsx', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageHeader(props);

        return <div data-tid='hold-luggage-header' />;
    },
}));

const mockHoldLuggageBanners = jest.fn();
jest.mock('./components/HoldLuggageBanners/HoldLuggageBanners.tsx', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageBanners(props);

        return <div data-tid='hold-luggage-banners' />;
    },
}));

const mockOutlineBanner = jest.fn();
const mockOutlineBannerContext = jest.fn();
jest.mock('frontend/components/common/OutlineBanner/OutlineBanner.tsx', () => ({
    __esModule: true,
    default: ({ children, ...restProps }) => {
        mockOutlineBanner(restProps);

        return <div data-tid='outline-banner'>{children}</div>;
    },
    OutlineBannerContext: {
        Provider: props => {
            mockOutlineBannerContext(props);

            return <div>{props.children}</div>;
        },
    },
}));

const mockBottomAlert = jest.fn();
jest.mock('./components/BottomAlert/BottomAlert', () => ({
    __esModule: true,
    default: props => {
        mockBottomAlert(props);

        return <div data-tid='bottom-alert' />;
    },
}));

const mockUseLuxuryInternalFlight = jest.fn().mockReturnValue(false);
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: () => mockUseLuxuryInternalFlight(),
}));

describe('HoldLuggage', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render shimmer while loading on Extras Page', () => {
        mockStores.appStore.isLoading = true;
        mockStores.layoutStore.isExtrasPage = true;
        render(<HoldLuggage {...mockProps} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
        expect(screen.queryByTestId('hold-luggage-container')).not.toBeInTheDocument();
    });

    it('should not render shimmer while loading on other pages', () => {
        mockStores.appStore.isLoading = true;
        render(<HoldLuggage {...mockProps} />);

        expect(screen.queryByTestId('shimmer')).not.toBeInTheDocument();
        expect(screen.getByTestId('hold-luggage-container')).toBeInTheDocument();
    });

    it('should render HoldLuggage', () => {
        render(<HoldLuggage {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-header')).toBeInTheDocument();
        expect(screen.getByTestId('hold-luggage-extras')).toBeInTheDocument();
        expect(screen.getByTestId('outline-banner')).toBeInTheDocument();
        expect(screen.getByTestId('hold-luggage-container')).toHaveClass('holdLuggage');
        expect(screen.getByTestId('hold-selected-container')).toHaveClass('luggageContainer');

        const settingsMock = {
            maxNumberOfAdditionalLuggage: 2,
            maxNumberOfSportEquipments: 1,
            largeSportEquipmentCategoryCode: 'SEO',
            maxNumberOfLargeSportsEquipment: 6,
        };

        expect(mockStores.bookingStore.holdLuggage.initializeHoldLuggage).toHaveBeenCalledWith({
            adultsAndChildrenNumber: mockStores.guestDetailsStore.adultsAndChildrenNumber,
            infantsNumber: mockStores.guestDetailsStore.infants.length,
            luggageTypes: {
                bag1: { categoryCode: 'BAGE', categoryType: HoldLuggageCategory.Bag },
            },
            luggagePrices: 'luggagePrices',
            selectedLuggage: 'luggage',
            selectedSportEquipment: 'sport',
            settings: settingsMock,
        });

        expect(mockOutlineBanner).toHaveBeenCalledWith({
            color: mockAncillariesParams.Color,
            textContent: mockHoldLuggageFields.OutlineBannerTextContent,
        });
        expect(mockOutlineBannerContext).toHaveBeenCalledWith({
            value: { theme: OutlineBannerTheme.NoTheme },
            children: expect.anything(),
        });
        expect(mockHoldLuggageExtras).toHaveBeenCalledWith({
            fields: mockHoldLuggageFields,
            cheapestSportLuggage: mockStores.bookingStore.cheapestSportLuggage,
            cheapestHoldLuggage: mockStores.bookingStore.cheapestHoldLuggage,
        });
        expect(mockHoldLuggageHeader).toHaveBeenCalledWith({
            fields: mockHoldLuggageFields,
            luggageCount: 7,
        });
        expect(mockHoldLuggageBanners).toHaveBeenCalledWith({
            unavailableMessageHeader: mockHoldLuggageFields.UnavailableMessageHeader,
            unavailableMessageDescription: mockHoldLuggageFields.UnavailableMessageDescription,
            requestFailureDescription: mockHoldLuggageFields.RequestFailureDescription,
            requestFailureHeader: mockHoldLuggageFields.RequestFailureHeader,
            internalFlightHeader: mockHoldLuggageFields.InternalFlightHeader,
            internalFlightDescription: mockHoldLuggageFields.InternalFlightDescription,
        });
        expect(mockHoldLuggageSelected).toHaveBeenCalledWith({
            infantsNumber: 1,
            additionalFields: mockHoldLuggageFields,
        });

        const holdLuggageExtras = screen.getByTestId('hold-luggage-extras');
        const holdLuggageSelected = screen.getByTestId('hold-luggage-selected');

        expect(holdLuggageExtras).toBeInTheDocument();
        expect(holdLuggageSelected).toBeInTheDocument();
        expect(holdLuggageSelected.compareDocumentPosition(holdLuggageExtras)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

        expect(mockBottomAlert).not.toHaveBeenCalled();
    });

    it('should render bottom alert when it is luxury package and NOT confirmation page', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        mockStores.layoutStore.isConfirmationPage = false;

        render(<HoldLuggage {...mockProps} />);

        expect(screen.getByTestId('bottom-alert')).toBeInTheDocument();
        expect(mockBottomAlert).toHaveBeenCalledWith({
            text: mockProps.fields?.ExtraBagsAndSportsNotAvailable,
        });
    });

    describe('internal flight ', () => {
        it('should render default on Extras', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = false;
            mockStores.layoutStore.isExtrasPage = true;

            render(<HoldLuggage {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-container')).toHaveClass('holdLuggage internalFlightContainer');

            const holdLuggageExtras = screen.getByTestId('hold-luggage-extras');
            const holdLuggageSelected = screen.getByTestId('hold-luggage-selected');

            expect(holdLuggageExtras).toBeInTheDocument();
            expect(holdLuggageSelected).toBeInTheDocument();

            expect(holdLuggageExtras.compareDocumentPosition(holdLuggageSelected)).toBe(
                Node.DOCUMENT_POSITION_FOLLOWING,
            );

            expect(mockHoldLuggageHeader).not.toHaveBeenCalled();
            expect(mockHoldLuggageBanners).not.toHaveBeenCalled();
        });

        it('should hide banners on any pages', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = false;

            render(<HoldLuggage {...mockProps} />);

            expect(mockHoldLuggageBanners).not.toHaveBeenCalled();
        });

        it('should render correctly when bookingStore.isFlightExternal is true and viewBookingStore.isFlightExternal is false', () => {
            mockStores.bookingStore.isFlightExternal = true;
            mockStores.viewBookingStore.isFlightExternal = false;

            render(<HoldLuggage {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-container')).toHaveClass('holdLuggage');
            expect(screen.getByTestId('hold-luggage-header')).toBeInTheDocument();
            expect(screen.getByTestId('hold-luggage-extras')).toBeInTheDocument();
            expect(mockHoldLuggageBanners).toHaveBeenCalled();
        });

        it('should render correctly when bookingStore.isFlightExternal is false and viewBookingStore.isFlightExternal is true', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = true;

            render(<HoldLuggage {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-container')).toHaveClass('holdLuggage');
            expect(screen.getByTestId('hold-luggage-header')).toBeInTheDocument();
            expect(screen.getByTestId('hold-luggage-extras')).toBeInTheDocument();
            expect(mockHoldLuggageBanners).toHaveBeenCalled();
        });

        it('should render correctly when both bookingStore.isFlightExternal and viewBookingStore.isFlightExternal are true', () => {
            mockStores.bookingStore.isFlightExternal = true;
            mockStores.viewBookingStore.isFlightExternal = true;

            render(<HoldLuggage {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-container')).toHaveClass('holdLuggage');
            expect(screen.getByTestId('hold-luggage-header')).toBeInTheDocument();
            expect(screen.getByTestId('hold-luggage-extras')).toBeInTheDocument();
            expect(mockHoldLuggageBanners).toHaveBeenCalled();
        });

        it('should NOT render banners when both bookingStore.isFlightExternal and viewBookingStore.isFlightExternal are false', () => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.viewBookingStore.isFlightExternal = false;

            render(<HoldLuggage {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-container')).toHaveClass('holdLuggage');
            expect(screen.getByTestId('hold-luggage-header')).toBeInTheDocument();
            expect(screen.queryByTestId('hold-luggage-banners')).not.toBeInTheDocument();
        });

        it('should render bottom alert for internal flight when it is luxury package and NOT confirmation page', () => {
            mockStores.bookingStore.isLuxuryPackage = true;
            mockStores.layoutStore.isConfirmationPage = false;

            render(<HoldLuggage {...mockProps} />);

            expect(screen.getByTestId('bottom-alert')).toBeInTheDocument();
            expect(mockBottomAlert).toHaveBeenCalledWith({
                text: mockProps.fields?.ExtraBagsAndSportsNotAvailable,
            });
        });

        it('should NOT render bottom alert for internal flight when it is NOT luxury package', () => {
            render(<HoldLuggage {...mockProps} />);

            expect(mockBottomAlert).not.toHaveBeenCalled();
        });

        it('should NOT render bottom alert for internal flight when it is luxury package but on confirmation page', () => {
            mockStores.bookingStore.isLuxuryPackage = true;
            mockStores.layoutStore.isConfirmationPage = true;

            render(<HoldLuggage {...mockProps} />);

            expect(mockBottomAlert).not.toHaveBeenCalled();
        });
    });

    it('should return 0 for infantsNumber when NO infants both in guest details store and props', () => {
        mockStores.guestDetailsStore.infants = [];
        mockProps.infantsNumber = undefined;

        render(<HoldLuggage {...mockProps} />);

        expect(mockStores.bookingStore.holdLuggage.initializeHoldLuggage).toHaveBeenCalledWith(
            expect.objectContaining({
                infantsNumber: 0,
            }),
        );
    });

    it('should NOT call initializeHoldLuggage when no bookingExtras', () => {
        mockStores.bookingStore.extraLuggage.bookingExtras = null;

        render(<HoldLuggage {...mockProps} />);

        expect(mockStores.bookingStore.holdLuggage.initializeHoldLuggage).not.toHaveBeenCalled();
    });

    describe('does NOT render components', () => {
        it('should NOT render HoldLuggage when NO fields', () => {
            delete mockProps.fields;

            const { container } = render(<HoldLuggage {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render HoldLuggage when it is luxury internal flight', () => {
            mockUseLuxuryInternalFlight.mockReturnValue(true);

            render(<HoldLuggage {...mockProps} />);

            expect(screen.queryByTestId('hold-luggage-container')).not.toBeInTheDocument();
            mockUseLuxuryInternalFlight.mockReturnValue(false);
        });

        it('should NOT render HoldLuggage when NO guests', () => {
            delete mockStores.guestDetailsStore.adultsAndChildrenNumber;
            mockProps.adultsAndChildrenNumber = 0;

            const { container } = render(<HoldLuggage {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render main content when canAddHoldLuggage == false AND infantsNumber == 0 AND defaultBagsNumber ==0 ', () => {
            mockStores.bookingStore.extraLuggage.canAddHoldLuggage = false;
            mockStores.bookingStore.extraLuggage.defaultBagsNumber = 0;
            mockStores.guestDetailsStore.infants = [];

            render(<HoldLuggage {...mockProps} />);

            expect(screen.queryByTestId('hold-luggage-extras')).not.toBeInTheDocument();
            expect(screen.queryByTestId('hold-luggage-selected')).not.toBeInTheDocument();
        });
    });

    describe('isConfirmationPage', () => {
        beforeEach(() => {
            mockStores.layoutStore.isConfirmationPage = true;
            mockProps.adultsAndChildrenNumber = 2;
        });

        it('should NOT render HoldLuggageBanners AND apply confirmation page styles', () => {
            render(<HoldLuggage {...mockProps} />);

            expect(screen.queryByTestId('hold-luggage-banners')).not.toBeInTheDocument();

            const container = screen.queryByTestId('hold-luggage-container');
            expect(container).not.toHaveClass('container');
            expect(container).toHaveClass('holdLuggageConfirmation');
        });

        it('should render HoldLuggage when NO complimentary bags but extraLuggage exists', () => {
            mockStores.bookingStore.extraLuggage.defaultBagsNumber = 0;
            mockStores.guestDetailsStore.infants = [];

            const { container } = render(<HoldLuggage {...mockProps} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it('should NOT render HoldLuggage when NO any bags to show', () => {
            mockStores.bookingStore.extraLuggage.defaultBagsNumber = 0;
            mockStores.bookingStore.extraLuggage.existingExtraLuggageItemsNumber = 0;
            mockStores.guestDetailsStore.infants = [];

            const { container } = render(<HoldLuggage {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render bottom alert when it is luxury package', () => {
            mockStores.bookingStore.isLuxuryPackage = true;

            render(<HoldLuggage {...mockProps} />);

            expect(mockBottomAlert).not.toHaveBeenCalled();
        });
    });

    describe('OutlineBannerContext', () => {
        it('should render OutlineBannerContext with theme LuxuryTheme when it is luxury package on extra page', () => {
            mockStores.bookingStore.isLuxuryPackage = true;
            mockStores.layoutStore.isExtrasPage = true;

            render(<HoldLuggage {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: { theme: OutlineBannerTheme.LuxuryTheme },
                children: expect.anything(),
            });
            expect(mockStores.bookingStore.extraLuggage.setHBGreenPromoShown).toHaveBeenCalledWith(false);
        });

        it('should render OutlineBannerContext with Promo Banner ', () => {
            mockStores.bookingStore.isLuxuryPackage = false;
            mockStores.layoutStore.isExtrasPage = true;
            mockStores.bookingStore.extraLuggage.canAddHoldLuggage = true;
            mockStores.bookingStore.extraLuggage.isLCBAddingUnavailable = true;
            mockStores.layoutStore.shouldPromoteBags = true;

            render(<HoldLuggage {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: { theme: OutlineBannerTheme.PromoTheme },
                children: expect.anything(),
            });
            expect(mockStores.bookingStore.extraLuggage.setHBGreenPromoShown).toHaveBeenCalledWith(true);
        });

        it('should render OutlineBannerContext with theme NoTheme when it is NOT luxury package on extra page', () => {
            mockStores.bookingStore.isLuxuryPackage = false;
            mockStores.layoutStore.isExtrasPage = true;

            render(<HoldLuggage {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: { theme: OutlineBannerTheme.NoTheme },
                children: expect.anything(),
            });
            expect(mockStores.bookingStore.extraLuggage.setHBGreenPromoShown).toHaveBeenCalledWith(false);
        });

        it('should render OutlineBannerContext with theme NoTheme when shouldPromoteBags is false', () => {
            mockStores.bookingStore.isLuxuryPackage = false;
            mockStores.layoutStore.isExtrasPage = true;
            mockStores.layoutStore.shouldPromoteBags = false;

            render(<HoldLuggage {...mockProps} />);

            expect(mockOutlineBannerContext).toHaveBeenCalledWith({
                value: { theme: OutlineBannerTheme.NoTheme },
                children: expect.anything(),
            });

            expect(mockStores.bookingStore.extraLuggage.setHBGreenPromoShown).toHaveBeenCalledWith(false);
        });
    });
});
