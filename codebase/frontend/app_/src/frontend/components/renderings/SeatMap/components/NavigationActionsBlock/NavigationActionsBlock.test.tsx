import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';

import NavigationActionsBlock, { INavigationActionsBlockProps } from './NavigationActionsBlock';

const createStores = () => ({
    layoutStore: { isPricesHidden: false, isTradePortal: false, isExtrasPage: false },
    appStore: {
        isScreenLarge: false,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('NavigationActionsBlock', () => {
    const resetMocks = (): INavigationActionsBlockProps => ({
        fields: {
            SelectionActionText: mockSitecoreField(
                'SelectionActionText {selectedSeatsCount} {seatsCount} {flightDirection}',
            ),
            FullSelectionActionText: mockSitecoreField('FullSelectionActionText {flightDirection}'),
            EmptySelectionBtnText: mockSitecoreField('EmptySelectionBtnText {flightDirection}'),
            OutboundFlightDirectionName: mockSitecoreField('OutboundFlightDirectionName'),
            InboundFlightDirectionName: mockSitecoreField('InboundFlightDirectionName'),
            ContinueToReturnBtnText: mockSitecoreField('ContinueToReturnBtnText'),
            ConfirmSeatsBtnText: mockSitecoreField('ConfirmSeatsBtnText'),
        } as any,
        totalPassengers: 2,
        widgetOutputData: {
            direction: SeatMapFlightDirection.Inbound,
            selectedSeatLength: 0,
            actionMode: NavigationActionMode.EmptySelection,
            isOutlined: false,
            isDisabled: false,
            shouldBtnClickDisabled: false,
        } as any,
        onSelectSeats: jest.fn(),
    });
    let mocks = resetMocks();

    beforeEach(() => {
        jest.resetAllMocks();
        mocks = resetMocks();
        mockStores = createStores();
    });

    window.SeatsMapWidget = {
        switchTab: jest.fn(),
        complete: jest.fn(),
    };

    describe('isScreenLarge', () => {
        it('should render action text when Screen is Large', () => {
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                actionMode: NavigationActionMode.EmptySelection,
                direction: SeatMapFlightDirection.Inbound,
            };

            mockStores.appStore.isScreenLarge = true;
            render(<NavigationActionsBlock {...mocks} />);
            expect(screen.getByText('EmptySelectionBtnText InboundFlightDirectionName')).toBeInTheDocument();
        });

        it('should NOT render action text when Screen is not Large', () => {
            render(<NavigationActionsBlock {...mocks} />);
            expect(screen.queryByText('SelectionActionText 0 2 InboundFlightDirectionName')).not.toBeInTheDocument();
        });
    });

    describe('handleSwitchTab', () => {
        it('should call SeatsMapWidget.complete in both directions', async () => {
            render(<NavigationActionsBlock {...mocks} />);

            await userEvent.click(screen.getByRole('button'));

            expect(window.SeatsMapWidget.complete).toHaveBeenCalled();
        });

        it('should switchTab ', async () => {
            mocks.widgetOutputData.direction = SeatMapFlightDirection.Outbound;
            render(<NavigationActionsBlock {...mocks} />);
            await userEvent.click(screen.getByRole('button'));

            expect(window.SeatsMapWidget.switchTab).toHaveBeenCalled();
        });

        it('should NOT call onSelectSeats when no widget data is set', async () => {
            mocks.widgetOutputData.direction = SeatMapFlightDirection.Inbound;
            render(<NavigationActionsBlock {...mocks} />);
            window.SeatsMapWidget.complete.mockResolvedValueOnce(undefined);
            await userEvent.click(screen.getByRole('button'));

            expect(mocks.onSelectSeats).not.toHaveBeenCalled();
        });

        it('should call onSelectSeats when widget data is set', async () => {
            mocks.widgetOutputData.direction = SeatMapFlightDirection.Inbound;
            render(<NavigationActionsBlock {...mocks} />);
            window.SeatsMapWidget.complete.mockResolvedValueOnce([
                { seats: [{ number: '1' }, { number: '2' }] },
                { seats: [{ number: '2' }] },
            ]);
            await userEvent.click(screen.getByRole('button'));

            expect(mocks.onSelectSeats).toHaveBeenCalledWith([
                {
                    seats: [
                        {
                            number: '1',
                        },
                        {
                            number: '2',
                        },
                    ],
                },
                { seats: [] },
            ]);
        });
    });

    describe('isPricesHidden', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenLarge = true;
        });

        it('should show prices when isPricesHidden is false ', () => {
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByTestId('seat-map-navigation-price')).toBeInTheDocument();
        });

        describe('on TradePortal', () => {
            beforeEach(() => {
                mockStores.layoutStore.isTradePortal = true;
                mockStores.layoutStore.isPricesHidden = true;
            });

            it('should show prices when isPricesHidden is true, but isExtrasPage is false', () => {
                render(<NavigationActionsBlock {...mocks} />);

                expect(screen.getByTestId('seat-map-navigation-price')).toBeInTheDocument();
            });

            it('should hide prices when isPricesHidden is true and isExtrasPage is true', () => {
                mockStores.layoutStore.isExtrasPage = true;

                render(<NavigationActionsBlock {...mocks} />);

                expect(screen.queryByTestId('seat-map-navigation-price')).not.toBeInTheDocument();
            });
        });
    });

    describe('actionText', () => {
        it('should return fullSelectionActionText with directionsOutbound when is OutboundFlight and all seats selected', () => {
            mockStores.appStore.isScreenLarge = true;
            mocks.totalPassengers = 1;
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                selectedSeatLength: 1,
                direction: SeatMapFlightDirection.Outbound,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('FullSelectionActionText outboundflightdirectionname')).toBeInTheDocument();
        });

        it('should return fullSelectionActionText with directionsreturn when is NOT OutboundFlight and all seats selected', () => {
            mockStores.appStore.isScreenLarge = true;
            mocks.totalPassengers = 1;
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                selectedSeatLength: 1,
                direction: SeatMapFlightDirection.Inbound,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('FullSelectionActionText inboundflightdirectionname')).toBeInTheDocument();
        });

        it('should return SeatsSectionTotalSeatsSelected with directionsOutbound when selectedSeat Length is not like passengersToMap Length', () => {
            mockStores.appStore.isScreenLarge = true;
            mocks.totalPassengers = 1;
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                selectedSeatLength: 0,
                direction: SeatMapFlightDirection.Outbound,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('SelectionActionText 0 1 outboundflightdirectionname')).toBeInTheDocument();
        });

        it('should return SeatsSectionTotalSeatsSelected with directionsreturn when selectedSeat Length is not like passengersToMap Length', () => {
            mockStores.appStore.isScreenLarge = true;
            mocks.totalPassengers = 1;
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                selectedSeatLength: 0,
                direction: SeatMapFlightDirection.Inbound,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('SelectionActionText 0 1 inboundflightdirectionname')).toBeInTheDocument();
        });
    });

    describe('getActionBtnText', () => {
        it('should show ContinueToReturnBtnText when NavigationActionMode is ContinueToReturn', () => {
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                actionMode: NavigationActionMode.ContinueToReturn,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('ContinueToReturnBtnText')).toBeInTheDocument();
        });

        it('should show ConfirmSeatsBtnText when NavigationActionMode is ConfirmSeats', () => {
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                actionMode: NavigationActionMode.ConfirmSeats,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('ConfirmSeatsBtnText')).toBeInTheDocument();
        });

        it('should show EmptySelectionBtnText when NavigationActionMode is EmptySelection (inbound)', () => {
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                actionMode: NavigationActionMode.EmptySelection,
                direction: SeatMapFlightDirection.Inbound,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('EmptySelectionBtnText InboundFlightDirectionName')).toBeInTheDocument();
        });

        it('should show EmptySelectionBtnText when NavigationActionMode is EmptySelection (outbound)', () => {
            mocks.widgetOutputData = {
                ...mocks.widgetOutputData,
                actionMode: NavigationActionMode.EmptySelection,
                direction: SeatMapFlightDirection.Outbound,
            };
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByText('EmptySelectionBtnText OutboundFlightDirectionName')).toBeInTheDocument();
        });
    });

    describe('buttonMobile class', () => {
        it('should be added to button when isScreenLarge = false', () => {
            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('buttonMobile');
            expect(screen.getByRole('button')).toHaveClass('button');
        });

        it('should NOT be added to button when isScreenLarge = true', () => {
            mockStores.appStore.isScreenLarge = true;

            render(<NavigationActionsBlock {...mocks} />);

            expect(screen.getByRole('button')).not.toHaveClass('buttonMobile');
            expect(screen.getByRole('button')).toHaveClass('button');
        });
    });
});
