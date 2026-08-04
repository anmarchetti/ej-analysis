import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockBooking } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';

import ManageHolidayEntry, { IManageHolidayEntryProps } from './ManageHolidayEntry';

expect.extend(toHaveNoViolations);

let mockProps: IManageHolidayEntryProps;
let mockUseStore;

jest.mock('frontend/hooks/useStore');

const mockPopup = jest.fn();
jest.mock('./components/ManageHolidayPopup/ManageHolidayPopup', () => ({
    __esModule: true,
    default: props => {
        mockPopup(props);

        return (
            <div data-tid='popup'>
                <button data-tid='amend-hotel-entry' onClick={props.onAmendHotelClick} />
                <button data-tid='amend-dates-entry' onClick={props.onAmendDatesClick} />
                <button data-tid='close-button' onClick={props.onClose} />
            </div>
        );
    },
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: jest.fn(() => false),
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockButtonProps(props);

        return <button data-tid='button' onClick={onClick} aria-label='button' />;
    },
}));

describe('<ManageHolidayEntry />', () => {
    const openPopup = async () => {
        const button = screen.getByTestId('button');
        await userEvent.click(button);
    };

    let isManageHolidayPopupOpened = false;

    beforeEach(() => {
        mockUseStore = {
            isNoAmendDatesAvailability: false,
            isAmendDatesError: false,
            areRoomAndBoardVariantsUnavailable: false,
            isNoAvailableFlightsPopupShown: false,
            isNoAvailabilityError: false,
            booking: mockBooking,
            isManageHolidayPopupOpened,
            setIsManageHolidayPopupOpened: jest.fn().mockImplementation(value => {
                isManageHolidayPopupOpened = value;
            }),
            isMicroAppManageMyHolidayAllowed: false,
            dropHotelRequest: jest.fn(),
            trackClickOnManageButton: jest.fn(),
            trackClickOnChangeHotelButton: jest.fn(),
        };

        mockProps = {
            onAmendDatesClick: jest.fn(),
            onAmendHotelClick: jest.fn(),
            amendDatesLabel: 'amendDatesLabel',
            amendHotelLabel: 'amendHotelLabel',
            manageBookingLabel: 'manageBookingLabel',
        };

        jest.mocked(useStore).mockReturnValue(mockUseStore);
    });

    it('Should render component', () => {
        render(<ManageHolidayEntry {...mockProps} />);

        expect(screen.getByTestId('manage-holiday-entry')).toBeInTheDocument();
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'manage-holidays-entry-cta',
                isFullWidth: false,
                children: 'manageBookingLabel',
            }),
        );
    });

    it('Should render component with isMicroAppManageMyHolidayAllowed', () => {
        mockUseStore.isMicroAppManageMyHolidayAllowed = true;

        render(<ManageHolidayEntry {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: true,
                isSmall: true,
            }),
        );
    });

    it('should NOT render component if no booking', () => {
        mockUseStore.booking = undefined;

        const { container } = render(<ManageHolidayEntry {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render button on mobile', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        render(<ManageHolidayEntry {...mockProps} />);

        expect(screen.getByTestId('manage-holiday-entry')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'manage-holidays-entry-cta',
                isFullWidth: true,
                children: 'manageBookingLabel',
            }),
        );
    });

    describe('ManageHolidayPopup', () => {
        it('Should render popup', async () => {
            mockUseStore.isManageHolidayPopupOpened = true;
            render(<ManageHolidayEntry {...mockProps} />);

            expect(screen.getByTestId('popup')).toBeInTheDocument();
            expect(mockPopup).toHaveBeenCalledWith(
                expect.objectContaining({
                    onClose: expect.any(Function),
                    onAmendDatesClick: expect.any(Function),
                    onAmendHotelClick: expect.any(Function),
                    booking: mockBooking,
                    amendDatesLabel: mockProps.amendDatesLabel,
                    amendHotelLabel: mockProps.amendHotelLabel,
                }),
            );
        });

        it('should handle hotel button click', async () => {
            mockUseStore.isManageHolidayPopupOpened = true;
            render(<ManageHolidayEntry {...mockProps} />);

            const hotelBtn = screen.getByTestId('amend-hotel-entry');

            await userEvent.click(hotelBtn);

            expect(mockUseStore.trackClickOnChangeHotelButton).toHaveBeenCalledWith(mockBooking);
            expect(mockProps.onAmendHotelClick).toHaveBeenCalledWith(expect.any(Object));
        });

        it('Should call setIsManageHolidayPopupOpened and trackClickOnManageButton when click on close button', async () => {
            mockUseStore.isManageHolidayPopupOpened = true;

            render(<ManageHolidayEntry {...mockProps} />);

            await openPopup();

            const popup = screen.getByTestId('popup');
            expect(popup).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('close-button'));

            expect(mockUseStore.setIsManageHolidayPopupOpened).toHaveBeenCalledWith(false);
            expect(mockUseStore.trackClickOnManageButton).toHaveBeenCalled();
        });
    });

    describe('Call setIsManageHolidayPopupOpened with false and drop request', () => {
        const renderWithMountedPopup = async () => {
            const { rerender } = render(<ManageHolidayEntry {...mockProps} />);
            await openPopup();

            expect(mockUseStore.setIsManageHolidayPopupOpened).toHaveBeenNthCalledWith(2, true);

            rerender(<ManageHolidayEntry {...mockProps} manageBookingLabel='re-render-change-prop' />);

            expect(mockUseStore.setIsManageHolidayPopupOpened).toHaveBeenNthCalledWith(3, false);
            expect(mockUseStore.dropHotelRequest).toHaveBeenCalled();
        };

        it('should be called when isNoAmendDatesAvailability has changed', async () => {
            jest.mocked(useStore).mockReturnValueOnce({
                ...mockUseStore,
                isNoAmendDatesAvailability: true,
            });

            await renderWithMountedPopup();
        });

        it('should be called when isAmendDatesError has changed', async () => {
            jest.mocked(useStore).mockReturnValueOnce({
                ...mockUseStore,
                isAmendDatesError: true,
            });

            await renderWithMountedPopup();
        });

        it('should be called when areRoomAndBoardVariantsUnavailable has changed', async () => {
            jest.mocked(useStore).mockReturnValueOnce({
                ...mockUseStore,
                areRoomAndBoardVariantsUnavailable: true,
            });

            await renderWithMountedPopup();
        });

        it('should be called when isNoAvailableFlightsPopupShown has changed', async () => {
            jest.mocked(useStore).mockReturnValueOnce({
                ...mockUseStore,
                isNoAvailableFlightsPopupShown: true,
            });

            await renderWithMountedPopup();
        });

        it('should be called when isNoAvailabilityError has changed', async () => {
            jest.mocked(useStore).mockReturnValueOnce({
                ...mockUseStore,
                isNoAvailabilityError: true,
            });

            await renderWithMountedPopup();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ManageHolidayEntry {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
