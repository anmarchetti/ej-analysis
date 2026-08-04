import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockUnavailablePopupFields } from 'frontend/__mocks__';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AmendHotelsUnavailablePopup from './AmendHotelsUnavailablePopup';

let mockProps: ISitecoreComponent<IUnavailablePopupFields>;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUnavailablePopupProps = jest.fn();
jest.mock('frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup', () => ({
    __esModule: true,
    default: ({ onClose, onConfirm, ...props }) => {
        mockUnavailablePopupProps(props);

        return (
            <>
                <div data-tid='unavailable-popup' onClick={onClose} />
                <div data-tid='unavailable-popup-confirm' onClick={onConfirm} />
            </>
        );
    },
}));

let mockUseAmendHotelData;
jest.mock('./hooks/useAmendHotelUnavailablePopup', () => ({
    __esModule: true,
    useAmendHotelUnavailablePopup: () => mockUseAmendHotelData,
}));

describe('<AmendHotelsUnavailablePopup />', () => {
    beforeEach(() => {
        mockUseAmendHotelData = {
            onClose: jest.fn(),
            onConfirm: jest.fn(),
            isLoading: false,
            isShown: true,
        };

        mockProps = {
            fields: mockUnavailablePopupFields,
            params: {},
            rendering: 'rendering',
        };
        mockStores = createMockStores({
            amendDatesStore: {
                onAmendDatesButtonClick: jest.fn(),

                isInitialDataLoading: false,
            },
            amendHotelStore: {
                setIsNoAlternativeHotels: jest.fn(),
                isNoAlternativeHotels: true,
            },
            viewBookingStore: {
                isManageHolidayPopupOpened: true,
            },
            trackingStore: {
                changeHotel: {
                    noAlternativeHotelsTracking: jest.fn(),
                    validationErrorHotelTracking: jest.fn(),
                },
            },
            layoutStore: {
                isViewBookingPage: false,
                isAmendHotelSummaryPage: false,
            },
        });
    });

    it('should NOT be rendered if no fields', () => {
        mockProps.fields = undefined;
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if hook return isShown = false', () => {
        mockUseAmendHotelData.isShown = false;
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
        expect(mockStores.trackingStore.changeHotel.noAlternativeHotelsTracking).not.toHaveBeenCalled();
        expect(mockStores.trackingStore.changeHotel.validationErrorHotelTracking).not.toHaveBeenCalled();
    });

    it('should render component', () => {
        mockUseAmendHotelData.isLoading = true;
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        expect(mockStores.trackingStore.changeHotel.noAlternativeHotelsTracking).not.toHaveBeenCalled();
        expect(screen.getByTestId('unavailable-popup')).toBeInTheDocument();
        expect(mockUnavailablePopupProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            isLoading: true,
            isInnerPopup: true,
        });
    });

    it('should call validationErrorHotelTracking method when isAmendHotelSummaryPage and popup is shown', () => {
        mockStores.layoutStore.isAmendHotelSummaryPage = true;
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        expect(mockStores.trackingStore.changeHotel.validationErrorHotelTracking).toHaveBeenCalled();
    });

    it('should call noAlternativeHotelsTracking method when isViewBookingPage and popup is shown', () => {
        mockStores.layoutStore.isViewBookingPage = true;
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        expect(mockStores.trackingStore.changeHotel.noAlternativeHotelsTracking).toHaveBeenCalled();
    });

    it('should call onClose function', async () => {
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        const popup = screen.getByTestId('unavailable-popup');
        await userEvent.click(popup);

        expect(mockUseAmendHotelData.onClose).toHaveBeenCalled();
    });

    it('should call onConfirm function', async () => {
        render(<AmendHotelsUnavailablePopup {...mockProps} />);

        const popup = screen.getByTestId('unavailable-popup-confirm');
        await userEvent.click(popup);

        expect(mockUseAmendHotelData.onConfirm).toHaveBeenCalled();
    });
});
