import React from 'react';
import { fireEvent, screen } from '@testing-library/dom';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendHotelOffer, mockBooking, mockHotel } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { LocalStorageType } from 'models/enum/LocalStorageType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { IMobileBasketProps } from 'frontend/components/renderings/AmendmentBasket/MobileBasket/MobileBasket';
import { AttentionPopupMobilePosition } from 'frontend/components/renderings/AttentionPopup/AttentionPopup';

import HotelDetailsMobileBasket from './HotelDetailsMobileBasket';

const createMockProps = (): IMobileBasketProps => ({
    fields: {
        Continue: mockSitecoreField('Continue'),
        CurrentDetails: mockSitecoreField('CurrentDetails'),
        GoBack: mockSitecoreField('GoBack'),
        HideDetails: mockSitecoreField('HideDetails'),
        NewDetails: mockSitecoreField('NewDetails'),
        SeeDetails: mockSitecoreField('SeeDetails'),
        HotelDetails: mockSitecoreField('HotelDetails'),
    },
    handleSubmit: jest.fn(),
    hasOptionSelected: false,
    applyNegativeMargin: false,
    showPrice: false,
    params: {},
    rendering: {},
    backLink: SitePath.AmendHotel,
    continueLabel: 'Continue',
    isHotelDetailsIncluded: true,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
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

const mockMobileBasketProps = jest.fn();
jest.mock('frontend/components/renderings/AmendmentBasket/MobileBasket/MobileBasket', () => ({
    __esModule: true,
    default: props => {
        mockMobileBasketProps(props);

        return (
            <div data-tid='mobile-basket'>
                {props.children}
                <button data-tid='basket-continue-button' onClick={props.handleSubmit} />
            </div>
        );
    },
}));

const mockHotelDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/HotelDetails/HotelDetails', () => ({
    __esModule: true,
    default: props => {
        mockHotelDetailsProps(props);

        return <div data-tid='hotel-details' />;
    },
}));

const mockHotelRatingDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails', () => ({
    __esModule: true,
    default: props => {
        mockHotelRatingDetailsProps(props);

        return <div data-tid='hotel-rating-details' />;
    },
}));

const mockOverlaySpinnerProps = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinnerProps(props);

        return <div data-tid='overlay-spinner' />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return (
            <div data-tid='placeholder' onClick={props.onClose}>
                {props.children}
            </div>
        );
    },
    Text: props => <div data-tid={props['data-tid']}>{props.field.value}</div>,
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

const mockGetWebStorageFunction = jest.fn().mockReturnValue({
    backLink: 'backLink',
    hotelOffer: mockAmendHotelOffer,
    booking: mockBooking,
    isOnlyGoBack: false,
});
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    getWebStorageItem: (...props) => mockGetWebStorageFunction(...props),
}));

describe('<HotelDetailsMobileBasket />', () => {
    Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: 'sessionStorage',
    });

    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendHotelStore: {
                setNewlySelectedHotelOffer: jest.fn(),
                setSelectedHotelDetailsOffer: jest.fn(),
                selectedHotelDetails: {
                    hotel: mockHotel,
                    amendHotelOffer: mockAmendHotelOffer,
                },
                selectNewHotel: jest.fn(),
                clearSelectedHotelDetails: jest.fn(),
                setIsNoAvailabilityError: jest.fn(),
                isNoAvailabilityError: false,
            },
            layoutStore: {
                isHotelDetailsBrowsePagePreview: true,
            },
            routerStore: {
                redirectTo: jest.fn(),
            },
            viewBookingStore: {
                baseUpdateBookingInfo: jest.fn(),
                booking: mockBooking,
            },
        });
    });

    it('should render components', () => {
        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(screen.queryByTestId('mobile-basket')).toBeInTheDocument();

        expect(screen.queryByTestId('hotel-rating-details')).toBeInTheDocument();
        expect(mockHotelDetailsProps).toHaveBeenCalledWith({
            className: 'row',
            dataTid: 'amend-hotel-details-footer-hotel-details',
            location: {
                city: mockHotel.resort.name,
                country: mockHotel.country.name,
                region: mockHotel.location.name,
            },
            name: mockHotel.name,
        });

        expect(screen.queryByTestId('hotel-rating-details')).toBeInTheDocument();
        expect(mockHotelRatingDetailsProps).toHaveBeenCalledWith({
            className: 'ratings',
            dataTid: 'amend-hotel-details-footer-ratings-details',
            ...mockHotel,
        });

        expect(mockPlaceholderProps).not.toHaveBeenCalled();
    });

    it('should call getWebStorageItem and update backLink', () => {
        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(mockGetWebStorageFunction).toHaveBeenCalledWith(
            LocalStorageType.HotelMobileBasket,
            true,
            'sessionStorage',
        );
        expect(mockMobileBasketProps).toHaveBeenCalledWith(
            expect.objectContaining({
                backLink: 'backLink',
            }),
        );
        expect(mockStores.amendHotelStore.setSelectedHotelDetailsOffer).not.toHaveBeenCalled();
        expect(mockStores.amendHotelStore.setNewlySelectedHotelOffer).not.toHaveBeenCalled();
        expect(mockStores.viewBookingStore.baseUpdateBookingInfo).not.toHaveBeenCalled();
    });

    it('should update hotel data when no selectedHotelDetails', () => {
        mockStores.amendHotelStore.selectedHotelDetails = null;
        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(mockStores.amendHotelStore.setSelectedHotelDetailsOffer).toHaveBeenCalledWith(
            mockAmendHotelOffer,
            mockAmendHotelOffer.hotel,
            'backLink',
        );
        expect(mockStores.amendHotelStore.setNewlySelectedHotelOffer).toHaveBeenCalledWith(mockAmendHotelOffer);
        expect(mockStores.viewBookingStore.baseUpdateBookingInfo).toHaveBeenCalledWith(mockBooking);
    });

    it('should NOT render components for non-preview mode', () => {
        mockStores.layoutStore.isHotelDetailsBrowsePagePreview = false;

        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(screen.queryByTestId('mobile-basket')).not.toBeInTheDocument();
    });

    it('should not render component for trade portal', () => {
        mockStores = createMockStores({
            layoutStore: {
                isHotelDetailsBrowsePagePreview: true,
                isTradePortal: true,
            },
            amendHotelStore: null,
        });

        const { container } = render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call MobileBasket with isOnlyBackButton when isOnlyGoBack has not been received from session storage', () => {
        mockGetWebStorageFunction.mockReturnValueOnce({
            backLink: 'backLink',
            hotelOffer: mockAmendHotelOffer,
            booking: mockBooking,
            isOnlyGoBack: true,
        });

        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(mockMobileBasketProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOnlyBackButton: true,
            }),
        );
    });

    it('should NOT render components for non-amendment flow', () => {
        mockStores.amendHotelStore.selectedHotelDetails = { hotel: null, offer: null };

        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(screen.queryByTestId('mobile-basket')).not.toBeInTheDocument();
    });

    it('should NOT render components for for desktop', () => {
        mockUseMobileViewport = false;

        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(screen.queryByTestId('mobile-basket')).not.toBeInTheDocument();
    });

    it('should render OverlaySpinner if isLoadingSummaryPage', () => {
        mockUseMobileViewport = true;
        mockStores.amendHotelStore.isLoadingSummaryPage = true;

        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(screen.queryByTestId('overlay-spinner')).toBeInTheDocument();
        expect(mockOverlaySpinnerProps).toHaveBeenCalledWith({
            header: SitecoreDictionary.AmendHotelLabelsValidatingHotel,
        });
    });

    it('should NOT call selectNewHotel when clicked with modifier keys', () => {
        render(<HotelDetailsMobileBasket {...mockProps} />);
        const selectButton = screen.getByTestId('basket-continue-button');

        fireEvent.click(selectButton, { ctrlKey: true });
        fireEvent.click(selectButton, { shiftKey: true });
        fireEvent.click(selectButton, { metaKey: true });
        fireEvent.click(selectButton, { button: 1 });

        expect(mockStores.amendHotelStore.selectNewHotel).not.toHaveBeenCalledWith(mockAmendHotelOffer);
    });

    it('should trigger selectNewHotel when the continue button is clicked', () => {
        render(<HotelDetailsMobileBasket {...mockProps} />);

        fireEvent.click(screen.getByTestId('basket-continue-button'));

        expect(mockStores.amendHotelStore.selectNewHotel).toHaveBeenCalledWith(mockAmendHotelOffer);
    });

    it('should render null if no fields', () => {
        mockProps.fields = null;

        const { container } = render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });

    it('should call clearSelectedHotelDetails on unmount', () => {
        const { unmount } = render(<HotelDetailsMobileBasket {...mockProps} />);

        unmount();

        expect(mockStores.amendHotelStore.clearSelectedHotelDetails).toHaveBeenCalled();
    });

    it('should render attention popup if validation error and calls setIsHotelNoAvailabilityError and redirect on close', async () => {
        mockUseMobileViewport = true;
        mockStores.amendHotelStore.isNoAvailabilityError = true;

        render(<HotelDetailsMobileBasket {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.AttentionPopup,
            rendering: mockProps.rendering,
            onClose: expect.any(Function),
            mobilePosition: AttentionPopupMobilePosition.Center,
            disableOutsideClick: true,
        });

        const attentionPopup = screen.getByTestId('placeholder');

        await userEvent.click(attentionPopup);

        expect(mockStores.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith('backLink');
    });
});
