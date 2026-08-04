import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockHoldLuggagePopupFields } from './__mocks__/mockHoldLuggagePopupFields';
import { HoldLuggagePopup, THoldLuggagePopupProps } from './HoldLuggagePopup';

const createProps = (): THoldLuggagePopupProps => ({
    fields: mockHoldLuggagePopupFields,
    params: {},
    rendering: {},
});

const createStores = () => ({
    appStore: { isScreenMedium: true },
    layoutStore: { getPhrase: jest.fn(p => p) },
    trackingStore: { trackHoldLuggagePopupLoad: jest.fn() },
    guestDetailsStore: {
        infants: [{ value: 'infant 1' }, { value: 'infant 2' }],
    },
    bookingStore: {
        holdLuggage: {
            isHoldLuggagePopupOpened: true,
            isCancelPopupOpened: false,
            isHoldLuggageInitialized: true,
            hasLuggageSelectionChanged: false,
            clearUnconfirmedLuggage: jest.fn(),
            setHoldLuggagePopupOpened: jest.fn(),
            setCancelPopupOpened: jest.fn(),
            setInitialStateFromSelection: jest.fn(),
        },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFullScreenPopup = jest.fn();
jest.mock('frontend/components/common/FullScreenPopup/FullScreenPopup', () => ({
    __esModule: true,
    default: ({ navigationActionBlock, popupBarContent, children, onClose, ...props }) => {
        mockFullScreenPopup(props);

        return (
            <div data-tid='full-screen-popup'>
                {navigationActionBlock}
                {popupBarContent}
                {children}
                <button onClick={onClose} />
            </div>
        );
    },
}));

const mockHoldLuggageCancelPopup = jest.fn();
jest.mock('./components/HoldLuggageCancelPopup/HoldLuggageCancelPopup', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageCancelPopup(props);

        return <div data-tid='cancel-popup' />;
    },
}));

const mockHoldLuggagePopupActions = jest.fn();
jest.mock('./components/HoldLuggagePopupActions/HoldLuggagePopupActions', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggagePopupActions(props);

        return <div data-tid='popup-actions' />;
    },
}));

const mockHoldLuggageInfoLabel = jest.fn();
jest.mock('./components/HoldLuggageInfoLabel/HoldLuggageInfoLabel', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageInfoLabel(props);

        return <div data-tid='hold-luggage-info-label' />;
    },
}));

const mockHoldLuggagePopupContent = jest.fn();
jest.mock('./components/HoldLuggagePopupContent/HoldLuggagePopupContent', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggagePopupContent(props);

        return <div data-tid='popup-content' />;
    },
}));

describe('HoldLuggagePopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggagePopup', () => {
        render(<HoldLuggagePopup {...mockProps} />);

        expect(mockStores.bookingStore.holdLuggage.setInitialStateFromSelection).toBeCalled();
        expect(mockStores.trackingStore.trackHoldLuggagePopupLoad).toBeCalled();
        expect(screen.getByTestId('full-screen-popup')).toBeInTheDocument();
        expect(mockFullScreenPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: {
                    BackToLabel: mockProps.fields.BackToExtras,
                    BtnCancel: { value: 'Globals.Buttons.Cancel' },
                },
                isMobile: false,
                isInitialized: true,
            }),
        );

        expect(screen.getByTestId('popup-actions')).toBeInTheDocument();
        expect(mockHoldLuggagePopupActions).toHaveBeenCalledWith(
            expect.objectContaining({
                ...mockProps.fields,
            }),
        );

        expect(screen.getByTestId('hold-luggage-info-label')).toBeInTheDocument();
        expect(mockHoldLuggageInfoLabel).toHaveBeenCalledWith(
            expect.objectContaining({
                NoLuggageAddedLabel: mockProps.fields.NoLuggageAddedLabel,
                LuggageAddedLabel: mockProps.fields.LuggageAddedLabel,
                isMobileContent: true,
            }),
        );

        expect(screen.getByTestId('popup-content')).toBeInTheDocument();
        expect(mockHoldLuggagePopupContent).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                rendering: mockProps.rendering,
            }),
        );
    });

    it('should NOT render when no fields', () => {
        delete mockProps.fields;

        const { container } = render(<HoldLuggagePopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when popup is NOT opened', () => {
        mockStores.bookingStore.holdLuggage.isHoldLuggagePopupOpened = false;

        const { container } = render(<HoldLuggagePopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockStores.bookingStore.holdLuggage.setInitialStateFromSelection).not.toBeCalled();
    });

    describe('backToPreviousPageClick', () => {
        it('should clear unconfirmed items and close popup when click on close button', async () => {
            render(<HoldLuggagePopup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.bookingStore.holdLuggage.clearUnconfirmedLuggage).toBeCalled();
            expect(mockStores.bookingStore.holdLuggage.setHoldLuggagePopupOpened).toHaveBeenCalledWith(false);
        });

        it('should call setCancelPopupOpened when click on close button and selection has changed ', async () => {
            mockStores.bookingStore.holdLuggage.hasLuggageSelectionChanged = true;

            render(<HoldLuggagePopup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.bookingStore.holdLuggage.setCancelPopupOpened).toHaveBeenCalledWith(true);
        });
    });

    describe('HoldLuggageCancelPopup', () => {
        it('should not render popup when isCancelPopupOpened = false', () => {
            render(<HoldLuggagePopup {...mockProps} />);

            expect(screen.queryByTestId('cancel-popup')).not.toBeInTheDocument();
        });

        it('should render popup when isCancelPopupOpened = true', () => {
            mockStores.bookingStore.holdLuggage.isCancelPopupOpened = true;

            render(<HoldLuggagePopup {...mockProps} />);

            expect(screen.queryByTestId('cancel-popup')).toBeInTheDocument();
            expect(mockHoldLuggageCancelPopup).toHaveBeenCalledWith(
                expect.objectContaining({
                    TitleCancelPopup: mockProps.fields.TitleCancelPopup,
                    TextCancelPopup: mockProps.fields.TextCancelPopup,
                    BackButtonCancelPopup: mockProps.fields.BackButtonCancelPopup,
                    ContinueButtonCancelPopup: mockProps.fields.ContinueButtonCancelPopup,
                }),
            );
        });
    });
});
