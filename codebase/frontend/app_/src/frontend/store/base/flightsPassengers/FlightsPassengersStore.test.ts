import { mockAllTypesPassengersList, mockBooking, mockPassengersList } from 'frontend/__mocks__';
import { cabinBagsMock, generateLuggageInfoItemMock } from 'frontend/__mocks__/extraLuggage';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import * as utils from 'frontend/utils/seatAndBags.utils';

import { FlightsPassengersStore } from './FlightsPassengersStore';

jest.mock('frontend/utils/seatAndBags.utils', () => ({
    ...jest.requireActual('frontend/utils/seatAndBags.utils'),
    getPassengersWithInfants: jest.fn(() => 'getPassengersWithInfants'),
    getPassengersWithAncillaries: jest.fn(),
}));

jest.mock('frontend/utils/route.utils', () => ({
    getFlightDigitalNumber: jest.fn(n => n),
}));

describe('FlightsPassengersStore', () => {
    const createRootStore = () =>
        ({
            bookingStore: {
                outboundFlightNumber: '1',
                inboundFlightNumber: '2',
                extraLuggage: {
                    availableLCBQuantity: [5, 10],
                },
            },
            layoutStore: {
                largeCabinBagCode: 'SCB1',
            },
            viewBookingStore: {
                outboundFlightNumber: '3',
                inboundFlightNumber: '4',
            },
            guestDetailsStore: {
                adultsAndChildrenNumber: 2,
            },
            seatMapStore: {
                inboundFlight: {
                    fltNo: '2',
                },
                outboundFlight: {
                    fltNo: '1',
                },
            },
        } as any);

    let store;
    let rootStore = createRootStore();

    beforeEach(() => {
        rootStore = createRootStore();
        store = new FlightsPassengersStore(rootStore);
    });

    it('passengersByQueue should combine all passengers in one array', () => {
        store.outBoundPassengers = mockAllTypesPassengersList;
        store.inBoundPassengers = mockAllTypesPassengersList;

        expect(store.passengersByQueue).toEqual([
            {
                outboundPassenger: mockAllTypesPassengersList[1],
                inboundPassenger: mockAllTypesPassengersList[1],
            },
            {
                outboundPassenger: mockAllTypesPassengersList[0],
                inboundPassenger: mockAllTypesPassengersList[0],
            },
            {
                outboundPassenger: mockAllTypesPassengersList[2],
                inboundPassenger: mockAllTypesPassengersList[2],
            },
            {
                outboundPassenger: mockAllTypesPassengersList[3],
                inboundPassenger: mockAllTypesPassengersList[3],
            },
        ]);
    });

    it('adultsWithInfantsCount return length of adultsWithInfants', () => {
        store.outBoundPassengers = mockAllTypesPassengersList;
        store.inBoundPassengers = mockAllTypesPassengersList;

        expect(store.adultsWithInfantsCount).toBe(1);
    });

    it('adultsWithoutInfantsCount return length of adultsWithoutInfants', () => {
        store.outBoundPassengers = mockAllTypesPassengersList;
        store.inBoundPassengers = mockAllTypesPassengersList;

        expect(store.adultsWithoutInfantsCount).toBe(1);
    });

    it('childrenCount return length of children', () => {
        store.outBoundPassengers = mockAllTypesPassengersList;
        store.inBoundPassengers = mockAllTypesPassengersList;

        expect(store.childrenCount).toBe(2);
    });

    describe('outboundFlightNumber', () => {
        it('should use outboundFlight from seatMapStore and call getFlightDigitalNumber', () => {
            expect(store.outboundFlightNumber).toEqual(rootStore.seatMapStore.outboundFlight);
            expect(getFlightDigitalNumber).toHaveBeenCalledWith(rootStore.seatMapStore.outboundFlight);
        });
    });

    describe('inboundFlightNumber', () => {
        it('should use inboundFlight from seatMapStore and call getFlightDigitalNumber', () => {
            expect(store.inboundFlightNumber).toEqual(rootStore.seatMapStore.inboundFlight);
            expect(getFlightDigitalNumber).toHaveBeenCalledWith(rootStore.seatMapStore.inboundFlight);
        });
    });

    describe('setPassengersStore', () => {
        it('should do nothing when NO guests in data', () => {
            const spy = jest.spyOn(utils, 'getPassengersWithAncillaries');

            store.setPassengersStore({});

            expect(spy).not.toHaveBeenCalled();
        });

        it('should set outBoundPassengers and inBoundPassengers', () => {
            const spyGetPassengersWithAncillaries = jest
                .spyOn(utils, 'getPassengersWithAncillaries')
                .mockReturnValueOnce([{ passengerId: '1' }])
                .mockReturnValueOnce([{ passengerId: '2' }]);

            jest.spyOn(store, 'outboundFlightNumber', 'get').mockReturnValue('1');
            jest.spyOn(store, 'inboundFlightNumber', 'get').mockReturnValue('2');

            const booking = {
                seatSelection: [
                    { seats: [{ price: 30 }, { price: 30 }, { price: 30 }] },
                    { seats: [{ price: 20 }, { price: 20 }, { price: 20 }] },
                ],
                guests: [mockBooking.guests[0]],
                extraLuggageInfo: {
                    items: [
                        ...cabinBagsMock.items,
                        generateLuggageInfoItemMock('1', '2', 'SCB1', 'CABI', 1, 60),
                        generateLuggageInfoItemMock('2', '2', 'SCB1', 'CABI', 1, 60),
                    ],
                },
            };

            store.setPassengersStore(booking);

            expect(spyGetPassengersWithAncillaries).toHaveBeenNthCalledWith(
                1,
                'getPassengersWithInfants',
                booking.seatSelection,
                '1',
                ['1', '2'],
            );
            expect(spyGetPassengersWithAncillaries).toHaveBeenNthCalledWith(
                2,
                'getPassengersWithInfants',
                booking.seatSelection,
                '2',
                ['1', '2'],
            );
            expect(store.outBoundPassengers).toEqual([{ passengerId: '1' }]);
            expect(store.inBoundPassengers).toEqual([{ passengerId: '2' }]);
        });
    });

    describe('LCBCount', () => {
        beforeEach(() => {
            store.outBoundPassengers = [...mockPassengersList];
        });

        it('should return 0 when no bags were added to outbound flight', () => {
            expect(store.LCBCount).toBe(0);
        });

        it('should return 1 when only 1 bag was added to outbound flight', () => {
            store.outBoundPassengers[1].hasLCB = true;

            expect(store.LCBCount).toBe(1);
        });

        it('should return number of bags that were added to outbound flight', () => {
            store.outBoundPassengers[0].hasLCB = true;
            store.outBoundPassengers[1].hasLCB = true;

            expect(store.LCBCount).toBe(2);
        });
    });

    describe('clearAllPassengersLCB', () => {
        beforeEach(() => {
            const passengers = [...mockPassengersList].map(p => ({ ...p, hasLCB: true }));

            store.inBoundPassengers = passengers;
            store.outBoundPassengers = passengers;
        });

        it('should remove lcb from all passengers', () => {
            store.clearAllPassengersLCB();

            expect(store.outBoundPassengers.map(p => p.hasLCB)).toEqual([false, false]);
            expect(store.inBoundPassengers.map(p => p.hasLCB)).toEqual([false, false]);
        });
    });

    describe('isLCBAssignedToAllPassengers', () => {
        it('should return true when all passengers have LCB', () => {
            store.outBoundPassengers = mockPassengersList;
            store.outBoundPassengers.forEach(p => {
                p.hasLCB = true;
            });

            expect(store.isLCBAssignedToAllPassengers).toBe(true);
        });

        it('should return false when NOT all passengers that can have a bag have it', () => {
            store.outBoundPassengers = mockPassengersList;
            store.outBoundPassengers[1].hasLCB = true;

            expect(store.isLCBAssignedToAllPassengers).toBe(false);
        });

        it('should return true when all passengers that can have a bag have it', () => {
            store.outBoundPassengers = mockPassengersList;
            store.outBoundPassengers[1].hasLCB = true;
            rootStore.bookingStore.extraLuggage.availableLCBQuantity = [1, 2];

            expect(store.isLCBAssignedToAllPassengers).toBe(true);
        });
    });
});
