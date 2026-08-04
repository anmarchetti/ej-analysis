import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as isBackend from 'frontend/utils/isBackend';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { SeatsNotAvailablePopup } from './SeatsNotAvailablePopup';

const mockIsBackend = isBackend as { default: () => boolean };

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/common/ConfirmationInfo/ConfirmationCheckbox', () => ({
    __esModule: true,
    default: ({ onChange }) => <button data-tid='confirmation-checkbox' onClick={onChange} />,
}));

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        ReselectSeatsButtonText: mockSitecoreField('ReselectSeatsButtonText'),
        ClearSeatsButtonText: mockSitecoreField('ClearSeatsButtonText'),
        ConfirmationCheckboxLabel: mockSitecoreField('ConfirmationCheckbox'),
    },
});

let props;
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/hooks/useReCaptcha');

describe('<SeatsNotAvailablePopup />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render when backend side', () => {
        mockIsBackend.default = () => true;
        const { container } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container).toBeEmptyDOMElement();
        mockIsBackend.default = () => false;
    });

    it('should NOT render when isSelectedSeatsUnavailableError is false', () => {
        mockStores.seatMapStore.isSelectedSeatsUnavailableError = false;
        mockStores.seatMapStore.isSeatMapFlowDisabledError = false;
        const { container } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isSeatMapFlowDisabledError is false', () => {
        mockStores.seatMapStore.isSelectedSeatsUnavailableError = false;
        mockStores.seatMapStore.isSeatMapFlowDisabledError = false;
        const { container } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no fields', () => {
        delete props.fields;
        const { container } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render when isSelectedSeatsUnavailableError is true', () => {
        mockStores.seatMapStore.isSelectedSeatsUnavailableError = true;
        mockStores.seatMapStore.isSeatMapFlowDisabledError = false;
        const { container, queryByTestId, getByText } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(getByText(props.fields.Title.value)).toBeInTheDocument();
        expect(getByText(props.fields.Description.value)).toBeInTheDocument();
        expect(queryByTestId('clear-seats-button')).toBeInTheDocument();
        expect(queryByTestId('reselect-seats-button')).toBeInTheDocument();
    });

    it('should render when isSeatMapFlowDisabledError is true', () => {
        mockStores.seatMapStore.isSelectedSeatsUnavailableError = false;
        mockStores.seatMapStore.isSeatMapFlowDisabledError = true;
        const { container, queryByTestId, getByText } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(getByText(props.fields.Title.value)).toBeInTheDocument();
        expect(getByText(props.fields.Description.value)).toBeInTheDocument();
        expect(queryByTestId('clear-seats-button')).toBeInTheDocument();
        expect(queryByTestId('reselect-seats-button')).toBeInTheDocument();
    });

    it('should NOT render title when Title field is not defined', () => {
        props.fields.Title = undefined;

        const { container } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container.querySelector('.seats-availability-popup__title')).not.toBeInTheDocument();
    });

    it('should NOT render description when Description field is not defined', () => {
        props.fields.Description = undefined;

        const { container } = render(<SeatsNotAvailablePopup {...props} />);

        expect(container.querySelector('.seats-availability-popup__description')).not.toBeInTheDocument();
    });

    it('should NOT render ClearSeats button when ReselectSeatsButtonText field is not defined', () => {
        props.fields.ClearSeatsButtonText = undefined;

        const { queryByTestId } = render(<SeatsNotAvailablePopup {...props} />);

        expect(queryByTestId('clear-seats-button')).not.toBeInTheDocument();
    });

    it('should NOT render ReselectSeats button when ReselectSeatsButtonText field is not defined', () => {
        props.fields.ReselectSeatsButtonText = undefined;

        const { queryByTestId } = render(<SeatsNotAvailablePopup {...props} />);

        expect(queryByTestId('reselect-seats-button')).not.toBeInTheDocument();
    });

    it('should render ReselectSeats button as a first button', () => {
        props.fields.ReselectSeatsButtonText = { value: 'ReselectSeatsButtonText' };
        props.fields.ClearSeatsButtonText = { value: 'ClearSeatsButtonText' };

        render(<SeatsNotAvailablePopup {...props} />);

        const { getByText } = within(screen.getAllByRole('button')?.[0]);
        expect(getByText(props.fields.ReselectSeatsButtonText.value)).toBeInTheDocument();
    });

    it('should render ClearSeats button as a second button', () => {
        props.fields.ReselectSeatsButtonText = { value: 'ReselectSeatsButtonText' };
        props.fields.ClearSeatsButtonText = { value: 'ClearSeatsButtonText' };

        render(<SeatsNotAvailablePopup {...props} />);

        const { getByText } = within(screen.getAllByRole('button')?.[1]);
        expect(getByText(props.fields.ClearSeatsButtonText.value)).toBeInTheDocument();
    });

    describe('reselect seats', () => {
        it('should reselect seats and redirect to Extras page', async () => {
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ReselectSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.clearSelectedSeatsUnavailableError).toHaveBeenCalled();
            expect(mockStores.seatMapStore.clearSelectedSeatsAndUpdateUrl).toHaveBeenCalled();
            expect(mockStores.bookingStore.clearPackageValidation).toHaveBeenCalled();

            expect(mockStores.routerStore.redirectToExtrasPage).toHaveBeenCalled();
        });

        describe('isAmendPaymentPage', () => {
            it('should redirect to View Booking page, close popup on Holidays', async () => {
                mockStores.layoutStore.isAmendPaymentPage = true;
                render(<SeatsNotAvailablePopup {...props} />);
                const submitButton = screen.getByRole('button', {
                    name: props.fields.ReselectSeatsButtonText.value,
                }) as Element;

                await userEvent.click(submitButton);

                expect(mockStores.amendPaymentStore.goBackToViewBooking).toHaveBeenCalledWith(undefined, true, true);
                expect(mockStores.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(false);
            });

            it('should redirect to View Booking page, close popup and clear amendPayment store on TradePortal', async () => {
                mockStores.layoutStore.isAmendPaymentPage = true;
                mockStores.layoutStore.isTradePortal = true;

                render(<SeatsNotAvailablePopup {...props} />);

                const checkbox = screen.getByTestId('confirmation-checkbox');
                const submitButton = screen.getByTestId('reselect-seats-button');

                await userEvent.click(checkbox);
                await userEvent.click(submitButton);

                expect(mockStores.amendPaymentStore.goBackToViewBooking).toHaveBeenCalledWith(undefined, true, true);
                expect(mockStores.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(false);
                expect(mockStores.amendPaymentStore.clearAmendPaymentStore).toHaveBeenCalled();
            });
        });

        it('should reselect seats when call ReselectSeatsButtonText on View booking page', async () => {
            mockStores.layoutStore.isViewBookingPage = true;
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ReselectSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.setValidatedSelectedSeats).toHaveBeenCalledWith(
                mockStores.viewBookingStore.booking?.seatSelection,
            );
            expect(mockStores.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(false);
            expect(mockStores.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(true);
            expect(mockStores.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(false);
        });

        it('should fetchSeatMap with new api response when call ReselectSeatsButtonText on View booking page', async () => {
            mockStores.layoutStore.isViewBookingPage = true;
            render(<SeatsNotAvailablePopup {...props} />);

            const submitButton = screen.getByRole('button', {
                name: props.fields.ReselectSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.fetchSeatMap).toHaveBeenCalledWith(
                mockStores.viewBookingStore.booking?.package.transport.routes,
                mockStores.viewBookingStore.booking?.prom,
            );
        });

        it('should NOT call fetchSeatMap clicking ReselectSeatsButton when booking is undefined', async () => {
            mockStores.layoutStore.isViewBookingPage = true;
            mockStores.viewBookingStore.booking = null;
            render(<SeatsNotAvailablePopup {...props} />);

            const submitButton = screen.getByRole('button', {
                name: props.fields.ReselectSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
        });
    });

    describe('clear seats', () => {
        it('should clear and validate seats when call ClearSeatsButtonText on Extras page', async () => {
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ClearSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.clearSelectedSeatsUnavailableError).toHaveBeenCalled();
            expect(mockStores.seatMapStore.clearSelectedSeatsAndUpdateUrl).toHaveBeenCalled();
            expect(mockStores.bookingStore.clearPackageValidation).toHaveBeenCalled();
            expect(mockStores.seatMapStore.clearSeatMapFlowDisabledError).toHaveBeenCalled();

            expect(mockStores.bookingStore.validatePackage).toHaveBeenCalled();
            expect(mockStores.bookingStore.setSelectedOfferPrices).toHaveBeenCalled();
        });

        describe('isAmendPaymentPage', () => {
            it('should redirect to View Booking page, close popup on Holidays', async () => {
                mockStores.layoutStore.isAmendPaymentPage = true;
                render(<SeatsNotAvailablePopup {...props} />);
                const submitButton = screen.getByRole('button', {
                    name: props.fields.ClearSeatsButtonText.value,
                }) as Element;

                await userEvent.click(submitButton);

                expect(mockStores.amendPaymentStore.goBackToViewBooking).toHaveBeenCalledWith(undefined, true);
                expect(mockStores.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(false);
            });

            it('should redirect to View Booking page, close popup, call clearAmendPaymentStore on TradePortal', async () => {
                mockStores.layoutStore.isAmendPaymentPage = true;
                mockStores.layoutStore.isTradePortal = true;

                render(<SeatsNotAvailablePopup {...props} />);

                const checkbox = screen.getByTestId('confirmation-checkbox');
                const submitButton = screen.getByTestId('reselect-seats-button');

                await userEvent.click(checkbox);
                await userEvent.click(submitButton);

                expect(mockStores.amendPaymentStore.goBackToViewBooking).toHaveBeenCalled();
            });
        });

        it('should clear seats when call ClearSeatsButtonText on View booking page', async () => {
            mockStores.layoutStore.isViewBookingPage = true;
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ClearSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.setValidatedSelectedSeats).toHaveBeenCalledWith(
                mockStores.viewBookingStore.booking?.seatSelection,
            );
            expect(mockStores.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(false);
            expect(mockStores.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(false);
        });

        it('should fetchSeatMap with new api response when call ReselectSeatsButtonText on View booking page', async () => {
            mockStores.layoutStore.isViewBookingPage = true;
            render(<SeatsNotAvailablePopup {...props} />);

            const submitButton = screen.getByRole('button', {
                name: props.fields.ClearSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.seatMapStore.fetchSeatMap).toHaveBeenCalledWith(
                mockStores.viewBookingStore.booking?.package.transport.routes,
                mockStores.viewBookingStore.booking?.prom,
            );
        });
    });

    describe('selectDefaultPaymentOption', () => {
        it('should NOT call selectDefaultPaymentOption on ClearSeats button click when it is not Payment or Confirm page', async () => {
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ClearSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.paymentStore.selectDefaultPaymentOption).not.toHaveBeenCalled();
        });

        it('should call selectDefaultPaymentOption on ClearSeats button click when it is Payment page', async () => {
            mockStores.layoutStore.isPaymentPage = true;
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ClearSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.paymentStore.selectDefaultPaymentOption).toHaveBeenCalled();
        });

        it('should call selectDefaultPaymentOption on ClearSeats button click when it is Confirm page', async () => {
            mockStores.layoutStore.isConfirmPage = true;
            mockStores.layoutStore.isTradePortal = true;
            render(<SeatsNotAvailablePopup {...props} />);
            const submitButton = screen.getByRole('button', {
                name: props.fields.ClearSeatsButtonText.value,
            }) as Element;

            await userEvent.click(submitButton);

            expect(mockStores.paymentStore.selectDefaultPaymentOption).toHaveBeenCalled();
        });
    });

    describe('Confirmation Checkbox', () => {
        it('should NOT render ConfirmationCheckbox when it is not trade portal', () => {
            render(<SeatsNotAvailablePopup {...props} />);

            expect(screen.queryByTestId('confirmation-checkbox')).not.toBeInTheDocument();
        });

        describe('on tradePortal', () => {
            beforeEach(() => {
                mockStores.layoutStore.isTradePortal = true;
            });

            it('should NOT render ConfirmationCheckbox when ConfirmationCheckboxLabel empty', () => {
                props.fields.ConfirmationCheckboxLabel = undefined;
                render(<SeatsNotAvailablePopup {...props} />);

                expect(screen.getByTestId('popup')).toBeInTheDocument();
                expect(screen.queryByTestId('confirmation-checkbox')).not.toBeInTheDocument();
            });

            it('should render ConfirmationCheckbox', () => {
                render(<SeatsNotAvailablePopup {...props} />);

                expect(screen.getByTestId('confirmation-checkbox')).toBeInTheDocument();
            });

            it('should make reselect button available when checkbox is selected', () => {
                render(<SeatsNotAvailablePopup {...props} />);

                const button = screen.getByTestId('reselect-seats-button');
                const checkbox = screen.getByTestId('confirmation-checkbox');

                expect(button).toBeDisabled();

                fireEvent.click(checkbox);

                expect(button).not.toBeDisabled();
            });
        });
    });
});
