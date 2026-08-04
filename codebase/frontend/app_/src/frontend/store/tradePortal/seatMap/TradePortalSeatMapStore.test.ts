import { ApiErrors } from 'models/enum/ApiErrors';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { TradePortalSeatMapStore } from './TradePortalSeatMapStore';

const validatedSelectedSeats = [
    {
        flightNumber: '1234',
        sectorId: '1',
        seats: [{ seatNumber: '11F', paxIndex: 1 }],
    },
];

describe('<TradePortalSeatMapStore />', () => {
    const createRootStore = () =>
        ({
            routerStore: {
                updateCurrentPage: jest.fn(),
            },
            queryParamsStore: {
                buildHotelDetailsQuery: jest.fn(),
            },
            bookingStore: {
                validatePackage: jest.fn(),
                togglePriceManipulating: jest.fn(),
            },
            trackingStore: {
                trackBookingExtrasUpdate: jest.fn(),
            },
            viewBookingStore: {
                continueToPay: jest.fn(),
                toggleAmendErrorPopup: jest.fn(),
            },
            layoutStore: {
                isViewBookingPage: false,
            },
            amendSeatsStore: {
                confirmAmendment: jest.fn(),
            },
        } as any);

    let rootStore = createRootStore();
    let store;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new TradePortalSeatMapStore(rootStore);
    });

    describe('onSelectSeats', () => {
        it('Should call setIsProcessingSeatSelection', async () => {
            const newSeats = [
                {
                    flightNumber: '5678',
                    sectorId: '1',
                    seats: [{ seatNumber: '23A', paxIndex: 1 }],
                },
            ];
            const callbackFn = jest.fn();
            const onErrorFn = jest.fn();
            store.setIsProcessingSeatSelection = jest.fn();
            await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

            expect(store.setIsProcessingSeatSelection).toBeCalledWith(true);
        });

        it('should call validate package when new seats were selected', async () => {
            store.validatedSelectedSeats = validatedSelectedSeats;
            rootStore.layoutStore.isViewBookingPage = false;
            const newSeats = [
                {
                    flightNumber: '5678',
                    sectorId: '1',
                    seats: [{ seatNumber: '23A', paxIndex: 1 }],
                },
            ];
            const callbackFn = jest.fn();
            const onErrorFn = jest.fn();
            store.setValidatedSelectedSeats = jest.fn();
            await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

            expect(store.setValidatedSelectedSeats).toBeCalledWith([
                { flightNumber: '5678', seats: [{ paxIndex: 1, seatNumber: '23A' }], sectorId: '1' },
            ]);
            expect(store.rootStore.bookingStore.togglePriceManipulating).toBeCalledWith(true);
            expect(store.rootStore.bookingStore.validatePackage).toBeCalled();
        });

        describe('onSuccess', () => {
            it('should call updateCurrentPage and callback when call onSelectSeats NOT on view-booking page', async () => {
                rootStore.bookingStore.validatePackage.mockImplementationOnce(
                    (arg1, arg2, arg3, onSuccess) =>
                        new Promise(resolve => {
                            onSuccess();
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = false;
                const newSeats = [
                    {
                        flightNumber: '5678',
                        sectorId: '1',
                        seats: [{ seatNumber: '23A', paxIndex: 1 }],
                    },
                ];
                const callbackFn = jest.fn();
                const onErrorFn = jest.fn();

                await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

                expect(rootStore.routerStore.updateCurrentPage).toBeCalledWith(
                    rootStore.queryParamsStore.buildHotelDetailsQuery(),
                );
                expect(callbackFn).toBeCalledWith();
            });

            it('should call updateCurrentPage and callback when call onSelectSeats on view-booking page', async () => {
                rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                    (arg1, onSuccess) =>
                        new Promise(resolve => {
                            onSuccess();
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = true;
                const newSeats = [
                    {
                        flightNumber: '5678',
                        sectorId: '1',
                        seats: [{ seatNumber: '23A', paxIndex: 1 }],
                    },
                ];
                const callbackFn = jest.fn();
                const onErrorFn = jest.fn();

                await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

                expect(rootStore.viewBookingStore.continueToPay).toBeCalled();
                expect(callbackFn).toBeCalledWith();
            });

            it('should call trackBookingExtrasUpdate and callback when call onSelectSeats Not on view-booking page', async () => {
                rootStore.bookingStore.validatePackage.mockImplementationOnce(
                    (arg1, arg2, arg3, onSuccess) =>
                        new Promise(resolve => {
                            onSuccess();
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = false;
                const newSeats = [
                    {
                        flightNumber: '5678',
                        sectorId: '1',
                        seats: [{ seatNumber: '23A', paxIndex: 1 }],
                    },
                ];
                const callbackFn = jest.fn();
                const onErrorFn = jest.fn();

                await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

                expect(rootStore.trackingStore.trackBookingExtrasUpdate).toBeCalledWith(EventTypes.ExtrasSeatUpdate);
                expect(callbackFn).toBeCalledWith();
            });
        });

        describe('onError', () => {
            it('should call onError when call onSelectSeats on view-booking page', async () => {
                rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                    (arg1, onSuccessValidation, onError) =>
                        new Promise(resolve => {
                            onError({ errorCode: '' });
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = true;
                store.setValidatedSelectedSeats = jest.fn();
                const newSeats = [
                    {
                        flightNumber: '5678',
                        sectorId: '1',
                        seats: [{ seatNumber: '23A', paxIndex: 1 }],
                    },
                ];
                const callbackFn = jest.fn();
                const onErrorFn = jest.fn();

                await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

                expect(rootStore.viewBookingStore.toggleAmendErrorPopup).toBeCalled();
                expect(onErrorFn).toBeCalledWith({ errorCode: '' });
            });

            it('should call onError when call onSelectSeats on view-booking page with error code', async () => {
                rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                    (arg1, onSuccessValidation, onError) =>
                        new Promise(resolve => {
                            onError({ errorCode: ApiErrors.SelectedSeatsUnavailableAmendFlow });
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = true;
                store.setValidatedSelectedSeats = jest.fn();
                const newSeats = [
                    {
                        flightNumber: '5678',
                        sectorId: '1',
                        seats: [{ seatNumber: '23A', paxIndex: 1 }],
                    },
                ];
                store.setIsSelectedSeatsUnavailableError = jest.fn();
                const callbackFn = jest.fn();
                const onErrorFn = jest.fn();

                await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

                expect(store.setIsSelectedSeatsUnavailableError).toBeCalledWith(true);
                expect(rootStore.viewBookingStore.toggleAmendErrorPopup).not.toBeCalled();
                expect(onErrorFn).toBeCalledWith({ errorCode: ApiErrors.SelectedSeatsUnavailableAmendFlow });
            });

            it('should call onError when call onSelectSeats NOT on view-booking page', async () => {
                rootStore.bookingStore.validatePackage.mockImplementationOnce(
                    (arg1, arg2, arg3, onSuccessValidation, onError) =>
                        new Promise(resolve => {
                            onError();
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = false;
                store.setValidatedSelectedSeats = jest.fn();
                const newSeats = [
                    {
                        flightNumber: '5678',
                        sectorId: '1',
                        seats: [{ seatNumber: '23A', paxIndex: 1 }],
                    },
                ];
                const callbackFn = jest.fn();
                const onErrorFn = jest.fn();

                await store.onSelectSeats(newSeats, callbackFn, onErrorFn);

                expect(onErrorFn).toBeCalledWith();
            });
        });
    });
});
