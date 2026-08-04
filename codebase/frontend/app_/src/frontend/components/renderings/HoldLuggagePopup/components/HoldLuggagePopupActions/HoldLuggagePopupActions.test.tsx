import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockAltNoTransfer } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockedTransfer } from 'frontend/__mocks__/tracking';
import { mockHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import { HoldLuggagePopupActions, THoldLuggagePopupActionsProps } from './HoldLuggagePopupActions';

const createProps = (): THoldLuggagePopupActionsProps => ({
    NoLuggageAddedButton: mockHoldLuggagePopupFields.NoLuggageAddedButton,
    NoLuggageAddedLabel: mockHoldLuggagePopupFields.NoLuggageAddedLabel,
    LuggageAddedLabel: mockHoldLuggagePopupFields.LuggageAddedLabel,
    LuggageAddedButton: mockHoldLuggagePopupFields.LuggageAddedButton,
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            isEnoughTimeForAddSETransfer: true,
            transfer: mockedTransfer,
            setIsSERemoveTransfer: jest.fn(),
            extraLuggage: { confirmExtraLuggage: jest.fn() },
            holdLuggage: {
                selectedTotalNumber: 3,
                selectedSportEquipmentNumber: 0,
                selectedLuggage: 'selectedLuggage',
                selectedSportEquipment: 'selectedSportEquipment',
                hasLuggageSelectionChanged: true,
                clearHoldLuggage: jest.fn(),
                confirmBagsSelection: jest.fn(),
                setHoldLuggagePopupOpened: jest.fn(),
            },
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHoldLuggageInfoLabel = jest.fn();
jest.mock(
    'frontend/components/renderings/HoldLuggagePopup/components/HoldLuggageInfoLabel/HoldLuggageInfoLabel',
    () => ({
        __esModule: true,
        default: props => {
            mockHoldLuggageInfoLabel(props);

            return <div data-tid='info-label'>HoldLuggageInfoLabel</div>;
        },
    }),
);

describe('HoldLuggagePopupActions', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggagePopupActions', () => {
        render(<HoldLuggagePopupActions {...mockProps} />);

        expect(screen.queryByTestId('info-label')).toBeInTheDocument();
        expect(mockHoldLuggageInfoLabel).toHaveBeenCalledWith(
            expect.objectContaining({
                NoLuggageAddedLabel: mockProps.NoLuggageAddedLabel,
                LuggageAddedLabel: mockProps.LuggageAddedLabel,
            }),
        );
    });

    describe('Button', () => {
        it('should have NoLuggageAddedButton text when no luggage selected', () => {
            mockStores.bookingStore.holdLuggage.selectedTotalNumber = 0;

            render(<HoldLuggagePopupActions {...mockProps} />);

            const button = screen.queryByTestId('hold-luggage-confirm');

            expect(button).toHaveTextContent('NoLuggageAddedButton');
            expect(button).toHaveClass('btn');
            expect(button).not.toHaveClass('confirmBtn');
        });

        it('should have LuggageAddedButton text when luggage selected and isScreenMedium = true ', () => {
            render(<HoldLuggagePopupActions {...mockProps} />);

            const button = screen.queryByTestId('hold-luggage-confirm');

            expect(button).toHaveTextContent('LuggageAddedButton');
            expect(button).toHaveClass('btn');
            expect(button).toHaveClass('confirmBtn');
        });

        it('should use dictionary as a text when luggage selected and isScreenMedium = true', () => {
            mockStores.appStore.isScreenMedium = false;

            render(<HoldLuggagePopupActions {...mockProps} />);

            expect(screen.queryByTestId('hold-luggage-confirm')).toHaveTextContent('Globals.Buttons.Continue');
        });

        describe('onConfirm', () => {
            it('should be called on Button click', async () => {
                render(<HoldLuggagePopupActions {...mockProps} />);

                await userEvent.click(screen.getByTestId('hold-luggage-confirm'));

                expect(mockStores.bookingStore.holdLuggage.setHoldLuggagePopupOpened).toHaveBeenCalledWith(false);
                expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                    'selectedLuggage',
                    'selectedSportEquipment',
                    mockStores.bookingStore.holdLuggage.clearHoldLuggage,
                );
                expect(mockStores.bookingStore.setIsSERemoveTransfer).not.toHaveBeenCalled();
            });

            it("should only close popup when selection hasn't been changed", async () => {
                mockStores.bookingStore.holdLuggage.hasLuggageSelectionChanged = false;

                render(<HoldLuggagePopupActions {...mockProps} />);

                await userEvent.click(screen.getByTestId('hold-luggage-confirm'));

                expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).not.toHaveBeenCalled();
            });

            describe('SE accommodation fail', () => {
                beforeEach(() => {
                    mockStores.bookingStore.holdLuggage.selectedSportEquipmentNumber = 2;
                });

                it('should call confirmExtraLuggage when offer has SE AND NO transfer AND NOT enough time for alert', async () => {
                    mockStores.bookingStore.transfer = mockAltNoTransfer;
                    mockStores.bookingStore.isEnoughTimeForAddSETransfer = false;

                    render(<HoldLuggagePopupActions {...mockProps} />);

                    await userEvent.click(screen.getByTestId('hold-luggage-confirm'));

                    expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                        'selectedLuggage',
                        'selectedSportEquipment',
                        mockStores.bookingStore.holdLuggage.clearHoldLuggage,
                    );
                    expect(mockStores.bookingStore.setIsSERemoveTransfer).not.toHaveBeenCalled();
                });

                it('should call confirmExtraLuggage when offer has SE AND transfer AND enough time for alert', async () => {
                    render(<HoldLuggagePopupActions {...mockProps} />);

                    await userEvent.click(screen.getByTestId('hold-luggage-confirm'));

                    expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                        'selectedLuggage',
                        'selectedSportEquipment',
                        mockStores.bookingStore.holdLuggage.clearHoldLuggage,
                    );
                    expect(mockStores.bookingStore.setIsSERemoveTransfer).not.toHaveBeenCalled();
                });

                it('should call setIsSERemoveTransfer when offer has SE AND transfer AND NOT enough time for alert', async () => {
                    mockStores.bookingStore.isEnoughTimeForAddSETransfer = false;

                    render(<HoldLuggagePopupActions {...mockProps} />);

                    await userEvent.click(screen.getByTestId('hold-luggage-confirm'));

                    expect(mockStores.bookingStore.setIsSERemoveTransfer).toHaveBeenCalledWith(true);
                    expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).not.toHaveBeenCalled();
                });
            });
        });
    });
});
