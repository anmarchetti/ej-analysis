import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IUnit } from 'models/data/IOffer';
import { BoardsAndRoomsEventAction, BoardsAndRoomsEventCategory } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { IAlterationResults } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import {
    defaultRoom,
    mostExpensiveRoom,
    nextMostExpensiveToSelectedRoom,
} from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';
import roomTypesFieldsMocks from 'frontend/components/renderings/RoomTypes/components/__mocks__/roomTypesFields';

import RoomAlterations, { IRoomAlterationsProps } from './RoomAlterations';

const createStores = () => ({
    bookingStore: {
        allBoardTypes: [],
        offerUnits: [defaultRoom],
        totalPrice: 20,
        totalPricePP: 10,
        fetchNewOfferContract: jest.fn(),
    },
    layoutStore: {
        isTradePortal: false,
        isEditMode: false,
        isPricesHidden: false,
        getPhrase: jest.fn(e => e),
        getSetting: jest.fn(a => a),
    },
    appStore: {
        isScreenMedium: true,
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
        trackBoardsAndRoomsSelection: jest.fn(),
        trackBoardsAndRoomsInteraction: jest.fn(),
    },
    marketStore: { formatMoney: jest.fn(a => `+£${a}`) },
});

const createProps = (): IRoomAlterationsProps => {
    const fields = roomTypesFieldsMocks();

    return {
        shouldCheckAlteration: false,
        newRoom: defaultRoom as IUnit,
        sectionIdx: 0,
        currentRoom: defaultRoom as IUnit,
        otherAvailableRoomsCount: 2,
        price: 10,
        fallbackImage: 'fallbackImage',
        isMultipleRoomSelected: true,
        subtitle: fields.AlterationSubtitle,
        boardResultTitle: fields.AlterationBoardResultTitle,
        roomResultTitle: fields.AlterationRoomResultTitle,
        resultSubtitle: fields.AlterationResultSubtitle,
        resultRoomsSubtitle: fields.AlterationResultRoomsSubtitle,
        boardResultTextSingular: fields.AlterationBoardResultTextSingular,
        roomResultTextSingular: fields.AlterationRoomResultTextSingular,
        roomResultTextPlural: fields.AlterationRoomResultTextPlural,
        changingFromTitle: fields.AlterationChangingFromTitle,
        freeChildPlaceInfoTitle: fields.FreeChildPlaceInfoTitle,
        freeChildPlaceInfoText: fields.FreeChildPlaceInfoText,
        onConfirm: jest.fn(),
        onAlterationChecked: jest.fn(),
        onPriceChange: jest.fn(),
    };
};

let mockStores;
let props: IRoomAlterationsProps;

const mockBookingAlterationDrawerComponent = jest.fn();

jest.mock('frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer', () => ({
    __esModule: true,
    default: ({ selectedItemElement, onCancel, onConfirm, ...props }) => {
        mockBookingAlterationDrawerComponent(props);

        return (
            <div data-tid='booking-alteration-drawer'>
                {selectedItemElement}
                <button onClick={onCancel}>cancel</button>
                <button onClick={onConfirm}>confirm</button>
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomAlterations />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should standard render', () => {
        render(<RoomAlterations {...props} />);

        expect(screen.getByTestId('booking-alteration-drawer')).toBeInTheDocument();
        expect(mockBookingAlterationDrawerComponent).toBeCalledWith({
            hideInfoBlock: true,
            price: 10,
            subtitle: props.subtitle,
            alterationChangingFromTitle: props.changingFromTitle,
            freeChildPlaceInfoTitle: props.freeChildPlaceInfoTitle,
            freeChildPlaceInfoText: props.freeChildPlaceInfoText,
            isOpen: false,
            isRoomSelection: true,
            fallbackImage: props.fallbackImage,
            alterationResults: [
                {
                    items: [],
                    title: props.boardResultTitle,
                    subtitle: props.resultSubtitle,
                    text: props.boardResultTextSingular,
                    isBoardAlteration: true,
                },
                {
                    items: [],
                    title: props.roomResultTitle,
                    subtitle: props.resultRoomsSubtitle,
                    text: props.roomResultTextSingular,
                },
            ],
        });
    });

    it('Should not render a drawer when newRoom is undefined and there is no need to make alterations', () => {
        props.newRoom = undefined;

        render(<RoomAlterations {...props} />);

        expect(screen.queryByTestId('booking-alteration-drawer')).not.toBeInTheDocument();
    });

    describe('Alteration cases', () => {
        beforeEach(() => {
            props.shouldCheckAlteration = true;
        });

        it('Should not render a drawer when newRoom is undefined', () => {
            props.newRoom = undefined;

            render(<RoomAlterations {...props} />);

            expect(screen.queryByTestId('booking-alteration-drawer')).not.toBeInTheDocument();
            expect(props.onAlterationChecked).not.toBeCalled();
            expect(props.onConfirm).not.toBeCalled();
        });

        it('Should call onConfirm when there are no alterations', () => {
            render(<RoomAlterations {...props} />);

            expect(props.onAlterationChecked).toBeCalled();
            expect(props.onConfirm).toBeCalledWith(props.sectionIdx, props.newRoom, props.price);
        });

        it('Should show a confirmation drawer when the new room is not free for kids', () => {
            props.newRoom = nextMostExpensiveToSelectedRoom as IUnit;
            props.currentRoom = mostExpensiveRoom as IUnit;

            render(<RoomAlterations {...props} />);

            expect(mockBookingAlterationDrawerComponent).toBeCalledWith(
                expect.objectContaining({ isOpen: true, hideInfoBlock: false }),
            );
        });

        it('Should show a confirmation drawer when the new room requires a board alteration', () => {
            props.newRoom = nextMostExpensiveToSelectedRoom as IUnit;

            render(<RoomAlterations {...props} />);

            expect(screen.getByTestId('booking-alteration-drawer')).toBeInTheDocument();
            expect(mockBookingAlterationDrawerComponent).toBeCalledWith(expect.objectContaining({ isOpen: true }));
        });

        it('Should NOT show a confirmation drawer and update the price when the new room is from the different contract', async () => {
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', accommodationId: 'id2', requireMoreRoomAlteration: true, isExt: true },
            } as IUnit;

            mockStores.bookingStore.fetchNewOfferContract.mockReturnValue({
                accom: { unit: [{}] },
                price: 2,
                pricePP: 1,
            });

            render(<RoomAlterations {...props} />);

            await waitFor(() =>
                expect(mockStores.bookingStore.fetchNewOfferContract).toBeCalledWith(
                    'id1',
                    'id2',
                    props.sectionIdx,
                    props.newRoom?.code,
                    true,
                    'AI',
                ),
            );
            expect(props.onPriceChange).toBeCalledWith(1 - props.price);
            expect(mockBookingAlterationDrawerComponent).toBeCalledWith(expect.objectContaining({ isOpen: false }));
        });

        it('Should call onPriceChange with total price diff when multi room', async () => {
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', accommodationId: 'id2', requireMoreRoomAlteration: true },
            } as IUnit;

            mockStores.bookingStore.fetchNewOfferContract.mockReturnValue({
                accom: { unit: [{}, {}] },
                price: 2,
                pricePP: 1,
            });

            render(<RoomAlterations {...props} />);

            await waitFor(() => expect(props.onPriceChange).toBeCalledWith(2 - mockStores.bookingStore.totalPrice));
        });

        it('Should show a confirmation drawer when the new room is from the different contract AND new room is not free for kids', async () => {
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', accommodationId: 'id2', requireMoreRoomAlteration: true, isExt: false },
            } as IUnit;
            props.currentRoom = mostExpensiveRoom as IUnit;

            mockStores.bookingStore.fetchNewOfferContract.mockReturnValue({
                accom: { unit: [{}] },
                price: 2,
                pricePP: 1,
            });

            render(<RoomAlterations {...props} />);

            await waitFor(() => {
                expect(mockStores.bookingStore.fetchNewOfferContract).toHaveBeenCalledWith(
                    'id1',
                    'id2',
                    props.sectionIdx,
                    props.newRoom?.code,
                    false,
                    'AI',
                );
                expect(props.onPriceChange).toHaveBeenCalledWith(1 - props.price);
                expect(mockBookingAlterationDrawerComponent).toHaveBeenLastCalledWith(
                    expect.objectContaining({ isOpen: true }),
                );
            });
        });

        it('Should show a confirmation drawer when the new room is not free for kids', () => {
            props.newRoom = nextMostExpensiveToSelectedRoom as IUnit;
            props.currentRoom = mostExpensiveRoom as IUnit;

            render(<RoomAlterations {...props} />);

            expect(mockBookingAlterationDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isOpen: true, hideInfoBlock: false }),
            );
        });

        it('Should display a plural title in the drawer for room alteration results when the new room is from the different contract', async () => {
            mockStores.bookingStore.offerUnits = [defaultRoom as IUnit, defaultRoom as IUnit, defaultRoom as IUnit];
            props.sectionIdx = 0;
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', accommodationId: 'id2', requireMoreRoomAlteration: true },
            } as IUnit;

            render(<RoomAlterations {...props} />);

            await waitFor(() => {
                expect(mockBookingAlterationDrawerComponent).toHaveBeenLastCalledWith(
                    expect.objectContaining({
                        isOpen: true,
                        hideInfoBlock: true,
                        alterationResults: expect.arrayContaining([
                            expect.objectContaining({
                                title: props.roomResultTitle,
                                subtitle: props.resultRoomsSubtitle,
                                text: props.roomResultTextPlural,
                            }),
                        ] as IAlterationResults[]),
                    }),
                );
            });
        });

        it('Should NOT call a price change when fetchNewOfferContract response is undefined', async () => {
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', accommodationId: 'id2', requireMoreRoomAlteration: true },
            } as IUnit;

            render(<RoomAlterations {...props} />);

            await waitFor(() => expect(mockStores.bookingStore.fetchNewOfferContract).toHaveBeenCalled());
            expect(props.onPriceChange).not.toHaveBeenCalled();
        });

        it('Should NOT call a fetchNewOfferContract when it is a single room offer', async () => {
            props.isMultipleRoomSelected = false;
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', accommodationId: 'id2', requireMoreRoomAlteration: true },
            } as IUnit;

            render(<RoomAlterations {...props} />);

            await waitFor(() => expect(mockStores.bookingStore.fetchNewOfferContract).not.toHaveBeenCalled());
            expect(mockBookingAlterationDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isOpen: true }),
            );
        });

        it('Should NOT call a fetchNewOfferContract when packageId is undefined', async () => {
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ accommodationId: 'id2', requireMoreRoomAlteration: true },
            } as IUnit;

            render(<RoomAlterations {...props} />);

            await waitFor(() => expect(mockStores.bookingStore.fetchNewOfferContract).not.toHaveBeenCalled());
        });

        it('Should NOT call a fetchNewOfferContract when accommodationId is undefined', async () => {
            props.newRoom = {
                ...nextMostExpensiveToSelectedRoom,
                ...{ packageId: 'id1', requireMoreRoomAlteration: true },
            } as IUnit;

            render(<RoomAlterations {...props} />);

            await waitFor(() => expect(mockStores.bookingStore.fetchNewOfferContract).not.toHaveBeenCalled());
        });

        it('Should close the drawer when cancel button was clicked', async () => {
            props.newRoom = nextMostExpensiveToSelectedRoom as IUnit;
            render(<RoomAlterations {...props} />);

            expect(mockBookingAlterationDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isOpen: true }),
            );

            await userEvent.click(screen.getByRole('button', { name: 'cancel' }));

            expect(mockBookingAlterationDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isOpen: false }),
            );
        });

        it('Should close the drawer and call onConfirm with a correct payload when confirm button was clicked', async () => {
            props.newRoom = nextMostExpensiveToSelectedRoom as IUnit;
            render(<RoomAlterations {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'confirm' }));

            expect(mockBookingAlterationDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isOpen: false }),
            );
            expect(props.onConfirm).toHaveBeenCalledWith(props.sectionIdx, props.newRoom, props.price);
        });

        it('should call tracking', async () => {
            render(<RoomAlterations {...props} />);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: BoardsAndRoomsEventAction.RoomSelected,
                    eventCategory: BoardsAndRoomsEventCategory.Room,
                    eventLabel: 'Double standard',
                    eventType: EventTypes.Interaction,
                    eventValue: 10,
                },
                {
                    destinationUrl: null,
                    genericValue1: 'Double standard',
                    genericValue2: '2',
                    genericValue3: 'NA',
                    genericValue4: 'Upgrade',
                },
            );
        });
    });
});
