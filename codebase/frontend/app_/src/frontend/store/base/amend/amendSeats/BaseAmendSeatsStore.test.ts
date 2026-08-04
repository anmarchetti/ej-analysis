import Axios from 'axios';

import { mockAmendPaymentPayload, mockBooking, mockGuests, mockSelectedSeat } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { GuestType } from 'models/enum/GuestType';
import { SeatType } from 'models/enum/SeatType';

import { BaseAmendSeatsStore } from './BaseAmendSeatsStore';

jest.mock('frontend/services/booking.service');
jest.mock('axios');

describe('BaseAmendSeatsStore', () => {
    const createRootStore = () =>
        ({
            appStore: { setAmendBookingItemPayload: jest.fn() },
            amendPaymentStore: {},
            routerStore: {
                redirectToViewBookingsPage: jest.fn(),
                redirectToLoginPage: jest.fn(),
            },
            viewBookingStore: {
                toggleAmendErrorPopup: jest.fn(),
            },
        } as any);

    let rootStore = createRootStore();

    beforeEach(() => {
        jest.resetAllMocks();
        rootStore = createRootStore();
    });

    const newSeatSelection = [
        {
            sectorId: 1,
            seats: [
                {
                    paxIndex: 1,
                    seatNumber: '2A',
                },
            ],
            flightNumber: '1234',
        },
    ];

    describe('clearStore', () => {
        it('should clear appropriate store fields', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection,
                    prevSeatSelection: [mockSelectedSeat],
                    guests: mockGuests,
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSelection).toBeTruthy();
            expect(store.prevSeatMapPassengers).toBeTruthy();

            store.clearStore();

            expect(store.newSelection).toBeFalsy();
            expect(store.prevSeatMapPassengers).toBeFalsy();
        });
    });

    describe('newSeatMapPassengers', () => {
        it('should return newSeatMapPassengers', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection,
                    prevSeatSelection: [
                        {
                            sectorId: 2,
                            seats: [
                                {
                                    paxIndex: 1,
                                    seatNumber: '2A',
                                },
                            ],
                            flightNumber: '1235',
                        },
                    ],
                    guests: [
                        {
                            index: '1',
                            isLead: false,
                            firstName: 'NAme',
                            lastName: 'Surname',
                            age: 21,
                            notBornYet: false,
                            sex: 'sex',
                            title: 'title',
                            type: GuestType.Adult,
                        },
                    ],
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSeatMapPassengers).toEqual([
                {
                    inboundPassenger: {
                        age: 21,
                        firstName: 'NAme',
                        index: '1',
                        isLead: false,
                        lastName: 'Surname',
                        notBornYet: false,
                        passengerId: '1',
                        seat: { paxIndex: 1, priceBand: SeatType.Standard, products: [], seatNumber: '2A' },
                        sex: 'sex',
                        title: 'title',
                        type: GuestType.Adult,
                        withInfant: false,
                    },
                    outboundPassenger: {
                        age: 21,
                        firstName: 'NAme',
                        index: '1',
                        isLead: false,
                        lastName: 'Surname',
                        notBornYet: false,
                        passengerId: '1',
                        sex: 'sex',
                        title: 'title',
                        type: GuestType.Adult,
                        withInfant: false,
                    },
                },
            ]);
        });

        it('should return null if no newSeatSelection', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection: undefined,
                    prevSeatSelection: [{}],
                    guests: [{}],
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSeatMapPassengers).toBeNull();
        });

        it('should return null if no prevSeatSelection', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection: [{}],
                    prevSeatSelection: undefined,
                    guests: [{}],
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSeatMapPassengers).toBeNull();
        });

        it('should return null if no guests', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection: [{}],
                    prevSeatSelection: [{}],
                    guests: undefined,
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSeatMapPassengers).toBeNull();
        });

        it('should return null if no outboundFlightNum', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection: [{}],
                    prevSeatSelection: [{}],
                    guests: [{}],
                    outboundFlightNum: undefined,
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSeatMapPassengers).toBeNull();
        });

        it('should return null if no inboundFlightNum', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    newSeatSelection: [{}],
                    prevSeatSelection: [{}],
                    guests: [{}],
                    outboundFlightNum: '1235',
                    inboundFlightNum: undefined,
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.newSeatMapPassengers).toBeNull();
        });
    });

    describe('prevSeatMapPassengers', () => {
        it('should return prevSeatMapPassengers', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    prevSeatSelection: [
                        {
                            sectorId: 2,
                            seats: [
                                {
                                    paxIndex: 1,
                                    seatNumber: '2A',
                                },
                            ],
                            flightNumber: '1235',
                        },
                    ],
                    guests: [
                        {
                            index: '1',
                            isLead: false,
                            firstName: 'NAme',
                            lastName: 'Surname',
                            age: 21,
                            notBornYet: false,
                            sex: 'sex',
                            title: 'title',
                            type: GuestType.Adult,
                        },
                    ],
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.prevSeatMapPassengers).toEqual([
                {
                    inboundPassenger: {
                        age: 21,
                        firstName: 'NAme',
                        index: '1',
                        isLead: false,
                        lastName: 'Surname',
                        notBornYet: false,
                        passengerId: '1',
                        sex: 'sex',
                        title: 'title',
                        type: GuestType.Adult,
                        withInfant: false,
                    },
                    outboundPassenger: {
                        age: 21,
                        firstName: 'NAme',
                        index: '1',
                        isLead: false,
                        lastName: 'Surname',
                        notBornYet: false,
                        passengerId: '1',
                        seat: { paxIndex: 1, priceBand: SeatType.Standard, products: [], seatNumber: '2A' },
                        sex: 'sex',
                        title: 'title',
                        type: GuestType.Adult,
                        withInfant: false,
                    },
                },
            ]);
        });

        it('should return null if no prevSeatSelection', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    prevSeatSelection: undefined,
                    guests: [{}],
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.prevSeatMapPassengers).toBeNull();
        });

        it('should return null if no guests', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    prevSeatSelection: [{}],
                    guests: undefined,
                    outboundFlightNum: '1235',
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.prevSeatMapPassengers).toBeNull();
        });

        it('should return null if no outboundFlightNum', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    prevSeatSelection: [{}],
                    guests: [{}],
                    outboundFlightNum: undefined,
                    inboundFlightNum: '1234',
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.prevSeatMapPassengers).toBeNull();
        });

        it('should return null if no inboundFlightNum', async () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: {
                    prevSeatSelection: [{}],
                    guests: [{}],
                    outboundFlightNum: '1235',
                    inboundFlightNum: undefined,
                },
            };

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(store.prevSeatMapPassengers).toBeNull();
        });
    });

    describe('initFromPayload', () => {
        it('should redirectToViewBookingsPage if no amendPaymentPayload', () => {
            rootStore.amendPaymentStore.amendPaymentPayload = undefined;
            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should redirectToViewBookingsPage if no selectedSeats', () => {
            rootStore.amendPaymentStore.amendPaymentPayload = {
                selectedSeats: undefined,
            };
            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
            expect(rootStore.appStore.setAmendBookingItemPayload).toHaveBeenCalledWith(undefined);
        });

        it('Should call baseUpdateBookingInfo with updated booking', () => {
            rootStore.amendPaymentStore.booking = mockBooking;
            rootStore.amendPaymentStore.amendPaymentPayload = {
                ...mockAmendPaymentPayload,
                selectedSeats: { newSeatSelection: 'newSeatSelection' },
            };
            rootStore.viewBookingStore.baseUpdateBookingInfo = jest.fn();

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(rootStore.viewBookingStore.baseUpdateBookingInfo).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockBooking,
                    seatSelection: 'newSeatSelection',
                }),
            );
        });

        it('Should NOT call baseUpdateBookingInfo when no booking', () => {
            rootStore.amendPaymentStore.booking = undefined;
            rootStore.amendPaymentStore.amendPaymentPayload = {
                ...mockAmendPaymentPayload,
                selectedSeats: { newSeatSelection: 'newSeatSelection' },
            };
            rootStore.viewBookingStore.baseUpdateBookingInfo = jest.fn();

            const store = new BaseAmendSeatsStore(rootStore);
            store.initFromPayload();

            expect(rootStore.viewBookingStore.baseUpdateBookingInfo).not.toHaveBeenCalled();
        });
    });

    describe('confirmAmendment', () => {
        it('should return if no booking', async () => {
            rootStore.viewBookingStore.booking = undefined;

            const store = new BaseAmendSeatsStore(rootStore);
            await store.confirmAmendment([]);

            expect(rootStore.appStore.setAmendBookingItemPayload).not.toHaveBeenCalled();
        });

        it('should clear store if no booking', async () => {
            rootStore.viewBookingStore.booking = {};

            const store = new BaseAmendSeatsStore(rootStore);
            await store.confirmAmendment([]);

            expect(rootStore.appStore.setAmendBookingItemPayload).toHaveBeenCalledWith(undefined);
        });

        it('should receive amended seats', async () => {
            rootStore.viewBookingStore.booking = {};

            const store = new BaseAmendSeatsStore(rootStore);
            await store.confirmAmendment([]);

            expect(bookingService.getAmendSeats).toHaveBeenCalled();
        });

        it('should set new selection', async () => {
            rootStore.viewBookingStore.booking = {};
            bookingService.getAmendSeats = jest.fn().mockResolvedValueOnce({ newSeatSelection, amendmentCharges: 12 });

            const store = new BaseAmendSeatsStore(rootStore);
            expect(store.newSelection).toBeNull();
            await store.confirmAmendment([]);

            expect(store.newSelection).toEqual(newSeatSelection);
        });

        it('should set amendmentCharges', async () => {
            rootStore.viewBookingStore.booking = {};
            bookingService.getAmendSeats = jest.fn().mockResolvedValueOnce({ newSeatSelection, amendmentCharges: 12 });

            const store = new BaseAmendSeatsStore(rootStore);
            expect(store.newSelection).toBeNull();
            await store.confirmAmendment([]);

            expect(store.amendmentCharges).toEqual(12);
        });

        it('should call onSuccess', async () => {
            const onSuccess = jest.fn();
            rootStore.viewBookingStore.booking = {};
            bookingService.getAmendSeats = jest.fn().mockResolvedValueOnce({ newSeatSelection, amendmentCharges: 12 });

            const store = new BaseAmendSeatsStore(rootStore);
            await store.confirmAmendment([], onSuccess);

            expect(onSuccess).toHaveBeenCalled();
        });

        it('should call onError', async () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();
            rootStore.viewBookingStore.booking = {};
            bookingService.getAmendSeats = jest.fn().mockImplementation(() => {
                throw new Error();
            });

            const store = new BaseAmendSeatsStore(rootStore);
            await store.confirmAmendment([], onSuccess, onError);

            expect(onError).toHaveBeenCalled();
        });

        it('should not cancel duplicate request', async () => {
            rootStore.viewBookingStore.booking = {};
            const cancel = jest.fn();
            Axios.CancelToken.source = jest.fn(() => ({ cancel })) as any;
            bookingService.getAmendSeats = jest.fn().mockResolvedValueOnce({ newSeatSelection, amendmentCharges: 12 });

            const store = new BaseAmendSeatsStore(rootStore);
            await store.confirmAmendment([]);

            expect(cancel).not.toHaveBeenCalled();
        });

        it('should cancel duplicate request', async () => {
            rootStore.viewBookingStore.booking = {};
            const cancel = jest.fn();
            Axios.CancelToken.source = jest.fn(() => ({ cancel })) as any;
            bookingService.getAmendSeats = jest.fn().mockResolvedValueOnce({ newSeatSelection, amendmentCharges: 12 });

            const store = new BaseAmendSeatsStore(rootStore);
            store.confirmAmendment([]);
            await store.confirmAmendment([]);

            expect(cancel).toHaveBeenCalled();
        });

        it('should set payment information for Trade Portal', async () => {
            const newPaymentInfo = {
                totalPrice: 2000,
            };

            const newPriceBreakdown = {
                priceBreakdown: [{ amount: 1 }],
            };

            const newTradeAgentPriceBreakdown = {
                priceBreakdown: [{ amount: 1 }],
            };

            rootStore.viewBookingStore.booking = {};
            bookingService.getAmendSeats = jest.fn().mockResolvedValueOnce({
                newSeatSelection,
                amendmentCharges: 12,
                paymentInfo: newPaymentInfo,
                priceBreakdown: newPriceBreakdown,
                tradeAgentPriceBreakdown: newTradeAgentPriceBreakdown,
            });

            const store = new BaseAmendSeatsStore(rootStore);
            expect(store.paymentInfo).toBeUndefined();
            expect(store.priceBreakdown).toBeUndefined();
            expect(store.tradeAgentPriceBreakdown).toBeUndefined();

            await store.confirmAmendment([]);

            expect(store.paymentInfo).toEqual(newPaymentInfo);
            expect(store.priceBreakdown).toEqual(newPriceBreakdown);
            expect(store.tradeAgentPriceBreakdown).toEqual(newTradeAgentPriceBreakdown);
        });
    });

    describe('totalPrice', () => {
        it('should return amendmentCharges', () => {
            const store = new BaseAmendSeatsStore(rootStore);
            store.amendmentCharges = 12;

            expect(store.totalPrice).toEqual(12);
        });

        it('should return 0 if no amendmentCharges', () => {
            const store = new BaseAmendSeatsStore(rootStore);
            store.amendmentCharges = undefined;

            expect(store.totalPrice).toEqual(0);
        });
    });
});
