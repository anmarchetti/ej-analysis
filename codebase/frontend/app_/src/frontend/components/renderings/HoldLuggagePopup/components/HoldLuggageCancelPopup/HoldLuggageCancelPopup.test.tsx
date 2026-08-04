import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import HoldLuggageCancelPopup, { IHoldLuggageCancelPopupProps } from './HoldLuggageCancelPopup';

const createProps = (): IHoldLuggageCancelPopupProps => ({
    TitleCancelPopup: mockHoldLuggagePopupFields.TitleCancelPopup,
    TextCancelPopup: mockHoldLuggagePopupFields.TextCancelPopup,
    BackButtonCancelPopup: mockHoldLuggagePopupFields.BackButtonCancelPopup,
    ContinueButtonCancelPopup: mockHoldLuggagePopupFields.ContinueButtonCancelPopup,
});

const createStores = () => ({
    bookingStore: {
        holdLuggage: {
            setHoldLuggagePopupOpened: jest.fn(),
            clearUnconfirmedLuggage: jest.fn(),
            setCancelPopupOpened: jest.fn(),
        },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopup = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopup(props);

        return <div data-tid='popup'>{props.children}</div>;
    },
}));

describe('HoldLuggageCancelPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggageCancelPopup', () => {
        render(<HoldLuggageCancelPopup {...mockProps} />);

        expect(screen.queryByTestId('popup')).toBeInTheDocument();
        expect(mockPopup).toBeCalledWith(
            expect.objectContaining({
                containerClass: 'cancelPopupContainer',
                dialogClass: 'popupDialog',
                bodyClass: 'popupBody',
                contentClass: 'contentClass',
                isInnerPopup: true,
            }),
        );
        expect(screen.queryByText('TitleCancelPopup')).toHaveClass('title');
        expect(screen.queryByText('TextCancelPopup')).toHaveClass('content');
        expect(screen.getByRole('button', { name: 'BackButtonCancelPopup' })).toHaveClass('backBtn');
        expect(screen.getByRole('button', { name: 'ContinueButtonCancelPopup' })).toHaveClass('continueBtn');
    });

    describe('onCloseClick', () => {
        it('should call clearUnconfirmedLuggage, setHoldLuggagePopupOpened, setCancelPopupOpened', async () => {
            render(<HoldLuggageCancelPopup {...mockProps} />);

            const btn = screen.getByRole('button', { name: 'BackButtonCancelPopup' });

            await userEvent.click(btn);

            expect(mockStores.bookingStore.holdLuggage.clearUnconfirmedLuggage).toBeCalled();
            expect(mockStores.bookingStore.holdLuggage.setHoldLuggagePopupOpened).toBeCalledWith(false);
            expect(mockStores.bookingStore.holdLuggage.setCancelPopupOpened).toBeCalledWith(false);
        });
    });

    describe('onContinueClick', () => {
        it('should call setCancelPopupOpened', async () => {
            render(<HoldLuggageCancelPopup {...mockProps} />);

            const btn = screen.getByRole('button', { name: 'ContinueButtonCancelPopup' });

            await userEvent.click(btn);

            expect(mockStores.bookingStore.holdLuggage.setCancelPopupOpened).toBeCalledWith(false);
        });
    });
});
