import { waitFor } from '@testing-library/dom';

import { mockAmendDatesStore } from 'frontend/__mocks__';
import { getSelectedSeatsFromWidgetData } from 'frontend/utils/seatMap.utils';
import { ApiErrors } from 'models/enum/ApiErrors';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { SeatMapStore } from './SeatMapStore';

const validatedSelectedSeats = [
    {
        flightNumber: '1234',
        sectorId: '1',
        seats: [{ seatNumber: '11F', paxIndex: 1 }],
    },
];

describe('SeatMapStore', () => {
    const createSettings = () => ({
        [SiteSettings.EnableSeatMapFlow]: true,
    });
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
            trackingStore: {
                trackBookingExtrasUpdate: jest.fn(),
            },
            amendDatesStore: mockAmendDatesStore,
        } as any);

    let rootStore = createRootStore();
    let settings = createSettings();
    let store;

    beforeEach(() => {
        settings = createSettings();
        rootStore = createRootStore();
        store = new SeatMapStore(rootStore);
    });

    describe('onSelectSeats', () => {
        const mockNewSeats = [
            {
                flightNumber: '5678',
                sectorId: '1',
                seats: [{ seatNumber: '23A', paxIndex: 1 }],
            },
        ];

        it('should call validate package when new seats were selected', async () => {
            store.validatedSelectedSeats = validatedSelectedSeats;
            rootStore.layoutStore.isViewBookingPage = false;
            const callbackFn = jest.fn();
            const onErrorFn = jest.fn();
            await store.onSelectSeats(mockNewSeats, callbackFn, onErrorFn);

            expect(store.rootStore.bookingStore.togglePriceManipulating).toBeCalledWith(true);
            expect(store.rootStore.bookingStore.validatePackage).toBeCalled();
        });

        it('should call confirmAmendment', async () => {
            jest.spyOn(store, 'isPostBooking', 'get').mockImplementation(() => true);
            store.setValidatedSelectedSeats = jest.fn();
            const callbackFn = jest.fn();
            const onErrorFn = jest.fn();
            const widgetSeats = getSelectedSeatsFromWidgetData(mockNewSeats);

            await store.onSelectSeats(mockNewSeats, callbackFn, onErrorFn);

            expect(store.rootStore.amendSeatsStore.confirmAmendment).toBeCalled();
            expect(store.setValidatedSelectedSeats).toBeCalledWith(widgetSeats);
            expect(rootStore.amendDatesStore.seats.handleSelectSeats).not.toHaveBeenCalled();
        });

        it('Should call handleSelectSeats from amendDatesStore.seats on amend dates summary page', async () => {
            rootStore.layoutStore.isAmendDatesSummaryPage = true;
            jest.spyOn(store, 'isPostBooking', 'get').mockImplementation(() => true);
            const onErrorFn = jest.fn();

            await store.onSelectSeats(mockNewSeats, onErrorFn);

            expect(rootStore.amendDatesStore.seats.handleSelectSeats).toHaveBeenCalledWith(
                mockNewSeats,
                expect.any(Function),
            );
        });

        describe('onSuccess', () => {
            it('should call continueToPay and callback when call onSelectSeats on view-booking page', async () => {
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

            it('should call trackBookingExtrasUpdate, updateCurrentPage and callback when call onSelectSeats NOT on view-booking page', async () => {
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
                expect(rootStore.routerStore.updateCurrentPage).toBeCalledWith(
                    rootStore.queryParamsStore.buildHotelDetailsQuery(),
                );
                expect(callbackFn).toBeCalledWith();
            });
        });

        describe('onError', () => {
            it('should call toggleAmendErrorPopup and onError when call onSelectSeats on view-booking page', async () => {
                rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                    (arg1, onSuccessValidation, onError) =>
                        new Promise(resolve => {
                            onError({ errorCode: ApiErrors.CharactersChangeLimitExeeded });
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

                expect(rootStore.viewBookingStore.toggleAmendErrorPopup).toBeCalled();
                expect(onErrorFn).toBeCalled();
            });

            it('should call setIsSelectedSeatsUnavailableError and onError when call onSelectSeats and received SelectedSeatsUnavailableAmendFlow error', async () => {
                rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                    (arg1, onSuccessValidation, onError) =>
                        new Promise(resolve => {
                            onError({ errorCode: ApiErrors.SelectedSeatsUnavailableAmendFlow });
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = true;
                store.setIsSelectedSeatsUnavailableError = jest.fn();
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

                expect(store.setIsSelectedSeatsUnavailableError).toBeCalledWith(true);
                expect(onErrorFn).toBeCalled();
            });

            it('should call setIsSelectedSeatsUnavailableError and onError when call onSelectSeats on view-booking page and received SelectedSeatsPriceChangeAmendFlow error', async () => {
                rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                    (arg1, onSuccessValidation, onError) =>
                        new Promise(resolve => {
                            onError({ errorCode: ApiErrors.SelectedSeatsPriceChangeAmendFlow });
                            resolve({});
                        }),
                );
                rootStore.layoutStore.isViewBookingPage = true;
                store.setIsSelectedSeatsUnavailableError = jest.fn();
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

                expect(store.setIsSelectedSeatsUnavailableError).toBeCalledWith(true);
                expect(onErrorFn).toBeCalled();
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

    describe('isProcessingSeatSelection', () => {
        const newSeats = [{ flightNumber: '5678', sectorId: '1', seats: [{ seatNumber: '23A', paxIndex: 1 }] }];
        rootStore = {
            routerStore: { updateCurrentPage: jest.fn() },
            seatMapStore: { validatedSelectedSeats: newSeats },
            queryParamsStore: { buildHotelDetailsQuery: jest.fn() },
            bookingStore: { validatePackage: jest.fn(), togglePriceManipulating: jest.fn() },
            viewBookingStore: {},
            layoutStore: { getSetting: s => settings[s], isViewBookingPage: false },
            amendSeatsStore: { confirmAmendment: jest.fn() },
            trackingStore: { trackBookingExtrasUpdate: jest.fn() },
        };

        it('should be true when processing seat selection in progress on viewBooking page', async () => {
            let releaseValidatePackage;
            rootStore.bookingStore.validatePackage.mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        releaseValidatePackage = resolve;
                    }),
            );
            expect(store.isProcessingSeatSelection).toBe(false);
            store.onSelectSeats(newSeats, jest.fn(), jest.fn());
            await waitFor(() => expect(store.isProcessingSeatSelection).toBe(true));
            await releaseValidatePackage();
            expect(store.isProcessingSeatSelection).toBe(false);
        });

        it('should be true when processing seat selection in progress not on viewBooking page', async () => {
            let releaseConfirmAmendment;
            rootStore.layoutStore.isViewBookingPage = true;
            rootStore.amendSeatsStore.confirmAmendment.mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        releaseConfirmAmendment = resolve;
                    }),
            );
            expect(store.isProcessingSeatSelection).toBe(false);
            store.onSelectSeats(newSeats, jest.fn(), jest.fn());
            await waitFor(() => expect(store.isProcessingSeatSelection).toBe(true));
            await releaseConfirmAmendment();
            expect(store.isProcessingSeatSelection).toBe(false);
        });
    });
});
