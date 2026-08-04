import { waitFor } from '@testing-library/react';
import Axios from 'axios';

import {
    createMockStores,
    mockAmendBookingPayload,
    mockAmendRoomAndBoardOffer,
    mockBillingInfo,
    mockBooking,
    mockRoomAndBoardRoomVariant,
    mockUnitRoom,
    userLoginMockInfo,
} from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { deepClone } from 'frontend/utils/array.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { IRoomVariant } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { BookingAllowanceRestrictions } from 'models/data/IBookingInfo';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ApiErrors } from 'models/enum/ApiErrors';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { AmendRoomAndBoardStore } from './AmendRoomAndBoardStore';

jest.mock('frontend/services/booking.service');

let store: AmendRoomAndBoardStore;

let mockIsCancel;
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        CancelToken: {
            source: jest.fn(() => ({ token: 'token', cancel: jest.fn() })),
        },
        isCancel: () => mockIsCancel,
    },
}));

jest.mock('frontend/utils/submitForm', () => ({
    __esModule: true,
    submitForm: jest.fn(),
}));

describe('AmendRoomAndBoardStore', () => {
    const mockedRoomVariants = [
        mockRoomAndBoardRoomVariant,
        { ...mockRoomAndBoardRoomVariant, roomType: 'unitRoomMock_mock' },
    ];

    beforeEach(() => {
        store = new AmendRoomAndBoardStore(
            createMockStores({
                routerStore: {
                    redirectToAmendRoomAndBoardPage: jest.fn(),
                },
                userStore: {
                    userData: userLoginMockInfo,
                    billingInfo: mockBillingInfo,
                },
                viewBookingStore: {
                    initBookingFromPayload: jest.fn().mockImplementation(cb => cb(mockBooking)),
                    allowanceRestrictions: {
                        [BookingAllowanceRestrictions.ByLeadPassenger]: false,
                        [BookingAllowanceRestrictions.ByExternalAgency]: false,
                    },
                    booking: mockBooking,
                    isLeadLoggedIn: true,
                },
                trackingStore: {
                    setPreviousPage: jest.fn(),
                },
                queryParamsStore: {
                    isFlightPlusHotelFunnel: false,
                },
            }),
        );
        mockIsCancel = false;
    });

    describe('cancelRequests', () => {
        it('It should invoke the cancel token and clear the property', () => {
            const mockCancel = jest.fn();
            (Axios.CancelToken.source as jest.MockedFn<any>) = jest.fn(() => ({ token: 'token', cancel: mockCancel }));
            store.cancelToken = Axios.CancelToken.source();
            store.cancelRequests();

            expect(mockCancel).toHaveBeenCalled();
            expect(store.cancelToken).toBeNull();
        });
    });

    describe('defaultVariant', () => {
        it('Should return null when no booking', () => {
            store.rootStore.viewBookingStore.booking = null;

            expect(store.defaultVariant).toBeNull();
        });

        it('Should return room variant when no chosen variant', () => {
            expect(store.defaultVariant).toStrictEqual(
                expect.objectContaining({
                    roomType: 'DB01',
                    boardType: 'HB',
                    offerPrice: 10,
                    amendmentCharges: 10,
                    fullAmendmentCharges: 0,
                    bookingPrice: 10,
                    amendmentPaymentInfo: {
                        amendmentCharges: 10,
                        amendmentChargesWithoutFees: 10,
                        feesPerPersons: [],
                        packagePriceWithFees: 10,
                        packagePriceWithoutFees: 10,
                        totalFeesAmount: 0,
                    },
                }),
            );
            expect(store.defaultVariant!.units[0].price).toBe(10);
        });

        it('Should return room variant when new variant has chosen and round the negative price', () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.chosenRoomVariant.offerPrice = 1588.1;

            expect(store.defaultVariant!.units[0].price).toBe(-1579);
            expect(store.defaultVariant!.amendmentCharges).toBe(-1579);
            expect(store.defaultVariant!.fullAmendmentCharges).toBe(0);
        });

        it('Should return room variant when new variant has chosen and round the positive price', () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.chosenRoomVariant.offerPrice = -1588.1;

            expect(store.defaultVariant!.units[0].price).toBe(1598);
            expect(store.defaultVariant!.amendmentCharges).toBe(1598);
            expect(store.defaultVariant!.fullAmendmentCharges).toBe(0);
        });
    });

    describe('isOriginalVariantChosen', () => {
        it('Should return true', () => {
            const { booking } = store.rootStore.viewBookingStore;
            store.chosenRoomVariant = {
                units: booking!.package.accom.rooms,
                offerPrice: booking!.paymentInfo.totalPrice,
            } as IRoomVariant;

            expect(store.isOriginalVariantChosen).toBe(true);
        });

        it('Should return false when new room chosen', () => {
            const { booking } = store.rootStore.viewBookingStore;
            const room = booking!.package.accom.rooms[0];
            store.chosenRoomVariant = {
                units: [{ ...room, code: 'test' }],
                offerPrice: booking!.paymentInfo.totalPrice,
            } as IRoomVariant;

            expect(store.isOriginalVariantChosen).toBe(false);
        });

        it('Should return false when new board chosen', () => {
            const { booking } = store.rootStore.viewBookingStore;
            const room = booking!.package.accom.rooms[0];
            store.chosenRoomVariant = {
                units: [{ ...room, boardType: { ...room.boardType, code: 'test' } }],
                offerPrice: booking!.paymentInfo.totalPrice,
            } as IRoomVariant;

            expect(store.isOriginalVariantChosen).toBe(false);
        });
    });

    describe('initiateRoomAndBoardPage', () => {
        it('Should validateRoomVariants be called when booking exists', async () => {
            store.validateRoomVariants = jest.fn();
            store.rootStore.routerStore.redirectToViewBookingsPage = jest.fn();

            await store.initiateRoomAndBoardPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).not.toHaveBeenCalled();
            expect(store.validateRoomVariants).toHaveBeenCalled();
        });

        it('Should redirectToViewBookingsPage be called when NO booking exists', async () => {
            store.rootStore.viewBookingStore.booking = null;
            store.validateRoomVariants = jest.fn();
            store.rootStore.routerStore.redirectToViewBookingsPage = jest.fn();

            await store.initiateRoomAndBoardPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
            expect(store.validateRoomVariants).not.toHaveBeenCalled();
        });

        it('Should call loadRoomAndBoardDataFromPayload when payload exists', async () => {
            store.loadRoomAndBoardDataFromPayload = jest.fn();
            store.rootStore.routerStore.redirectToViewBookingsPage = jest.fn();
            store.validateRoomVariants = jest.fn();
            store.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;

            await store.initiateRoomAndBoardPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).not.toHaveBeenCalled();
            expect(store.validateRoomVariants).not.toHaveBeenCalled();
            expect(store.loadRoomAndBoardDataFromPayload).toHaveBeenCalled();
        });
    });

    describe('allowanceRestrictions', () => {
        it('Should return all reasons', () => {
            (store.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<AmendBookingStatus[]>) = [
                AmendBookingStatus.AmendTransfersDisabledByTimeBound,
                AmendBookingStatus.AmendRoomAndBoardDisabledByAtcom,
                AmendBookingStatus.AmendRoomAndBoardDisabledByHavingMultipleRooms,
            ];

            const { byMultipleRooms, byAtcom, byTimeBound } = store.allowanceRestrictions;

            expect(byMultipleRooms).toBe(true);
            expect(byAtcom).toBe(true);
            expect(byTimeBound).toBe(true);
        });
    });

    describe('amendCTAState', () => {
        it('Should return restriction by rooms', () => {
            jest.spyOn(store, 'allowanceRestrictions', 'get').mockReturnValueOnce({
                byMultipleRooms: true,
                byTimeBound: false,
                byAtcom: false,
                byDisruption: false,
            });

            expect(store.amendCTAState).toStrictEqual({ isVisible: true, isDisabled: true });
        });

        it('Should return visible (enabled) when restricted only by rooms and multi-room flag is enabled', () => {
            Object.defineProperty(store.rootStore.viewBookingStore, 'isMicroAppAmendMultiRoomAndBoardAllowed', {
                configurable: true,
                get: () => true,
            });
            jest.spyOn(store, 'allowanceRestrictions', 'get').mockReturnValueOnce({
                byMultipleRooms: true,
                byTimeBound: false,
                byAtcom: false,
                byDisruption: false,
            });

            expect(store.amendCTAState).toStrictEqual({ isVisible: true });
        });

        it('Should return visible (disabled) when restricted only by rooms and multi-room flag is disabled', () => {
            Object.defineProperty(store.rootStore.viewBookingStore, 'isMicroAppAmendMultiRoomAndBoardAllowed', {
                configurable: true,
                get: () => false,
            });
            jest.spyOn(store, 'allowanceRestrictions', 'get').mockReturnValueOnce({
                byMultipleRooms: true,
                byTimeBound: false,
                byAtcom: false,
                byDisruption: false,
            });

            expect(store.amendCTAState).toStrictEqual({ isVisible: true, isDisabled: true });
        });

        it('Should return isVisible equals false when amendmentInfo.roomAndBoard will be false', () => {
            store.rootStore.viewBookingStore.booking!.amendmentInfo!.roomAndBoard = false;

            expect(store.amendCTAState).toStrictEqual({ isVisible: false });
        });

        it('Should return isVisible equals true when amendmentInfo.roomAndBoard will be true', () => {
            store.rootStore.viewBookingStore.booking!.amendmentInfo!.roomAndBoard = true;
            expect(store.amendCTAState).toStrictEqual({ isVisible: true });
        });

        it('Should return isVisible and isDisabled equal true when booking was created with trade agent', () => {
            store.rootStore.viewBookingStore.allowanceRestrictions.byExternalAgency = true;

            expect(store.amendCTAState).toStrictEqual({ isVisible: true, isDisabled: true });
        });

        it('should be visible when non lead passenger has been logged in and none of the disabled statuses are present', () => {
            (store.rootStore.viewBookingStore as any).isLeadLoggedIn = false;
            store.rootStore.viewBookingStore.allowanceRestrictions.byLeadPassenger = true;

            expect(store.amendCTAState).toStrictEqual({ isVisible: true });
        });

        it('should not be visible when non lead passenger has been logged in and one of disabled statuses is present', () => {
            (store.rootStore.viewBookingStore as any).isLeadLoggedIn = false;
            store.rootStore.viewBookingStore.allowanceRestrictions.byLeadPassenger = true;
            (store.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<AmendBookingStatus[]>) = [
                AmendBookingStatus.AmendRoomAndBoardDisabledOnSite,
            ];

            expect(store.amendCTAState).toStrictEqual({ isVisible: false });
        });

        it('Should return isVisible and isDisabled equal true when booking has status about flight disruption', () => {
            (store.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<AmendBookingStatus[]>) = [
                AmendBookingStatus.AmendRoomAndBoardDisabledByFlightsDisruption,
            ];

            expect(store.amendCTAState).toStrictEqual({ isVisible: true, isDisabled: true });
        });

        it('Not visible when non lead passenger has been logged in and one of disabled statuses is present', () => {
            (store.rootStore.viewBookingStore as any).isLeadLoggedIn = false;

            expect(store.isAmendCTAVisible).toBe(false);
        });
    });

    describe('isAmendCTADisabled', () => {
        it('Should return isDisabled value', () => {
            jest.spyOn(store, 'amendCTAState', 'get').mockReturnValueOnce({ isDisabled: true, isVisible: true });

            expect(store.isAmendCTADisabled).toBe(true);
        });
    });

    describe('isAmendCTAVisible', () => {
        it('Should return isVisible value', () => {
            jest.spyOn(store, 'amendCTAState', 'get').mockReturnValueOnce({ isDisabled: true, isVisible: true });

            expect(store.isAmendCTAVisible).toBe(true);
        });
    });

    describe('loadRoomAndBoardData', () => {
        it('Should call getAmendRoomAndBoardVariants, constructAltBoardFromRoomVariants and set upgradPrice', async () => {
            bookingService.getAmendRoomAndBoardVariants = jest
                .fn()
                .mockResolvedValueOnce({ roomVariants: [mockRoomAndBoardRoomVariant], upsellAmount: 10 });
            store.constructAltBoardsFromRoomVariants = jest.fn();

            await store.loadRoomAndBoardData();

            expect(bookingService.getAmendRoomAndBoardVariants).toHaveBeenCalledWith(mockBooking.bookingReference);
            expect(store.constructAltBoardsFromRoomVariants).toHaveBeenCalledWith([mockRoomAndBoardRoomVariant]);
            expect(store.upgradePrice).toBe(10);
            expect(store.chosenRoomVariant).toStrictEqual({
                units: [
                    {
                        ...mockBooking.package.accom.rooms[0],
                        price: 10,
                        pricePP: 1,
                    },
                ],
                amendmentPaymentInfo: {
                    amendmentCharges: 10,
                    amendmentChargesWithoutFees: 10,
                    feesPerPersons: [],
                    packagePriceWithFees: 10,
                    packagePriceWithoutFees: 10,
                    totalFeesAmount: 0,
                },

                offerPrice: mockBooking.paymentInfo.totalPrice,
                amendmentCharges: 10,
                boardType: 'HB',
                fullAmendmentCharges: 0,
                roomType: 'DB01',
                bookingPrice: 10,
            });
        });

        it('Should NOT be process when no booking', async () => {
            store.rootStore.viewBookingStore.booking = null;
            bookingService.getAmendRoomAndBoardVariants = jest.fn();
            store.constructAltBoardsFromRoomVariants = jest.fn();

            await store.loadRoomAndBoardData();

            expect(bookingService.getAmendRoomAndBoardVariants).not.toHaveBeenCalled();
            expect(store.constructAltBoardsFromRoomVariants).not.toHaveBeenCalled();
        });

        it('Should catch an error', async () => {
            store.applyError = jest.fn();
            bookingService.getAmendRoomAndBoardVariants = jest
                .fn()
                .mockRejectedValueOnce({ message: 'Test', code: 'Code' });

            await store.loadRoomAndBoardData();

            expect(store.applyError).toHaveBeenCalled();
        });
    });

    describe('goToAmendRoomAndBoardPage', () => {
        it('Should redirect to amend room and board page', async () => {
            bookingService.getAmendRoomAndBoardVariants = jest
                .fn()
                .mockResolvedValueOnce({ roomVariants: [mockRoomAndBoardRoomVariant] });
            await store.loadRoomAndBoardData();

            store.goToAmendRoomAndBoardPage();

            expect(store.rootStore.routerStore.redirectToAmendRoomAndBoardPage).toHaveBeenCalled();
        });

        it('Should NOT redirect to amend room and board page when there is an error', async () => {
            bookingService.getAmendRoomAndBoardVariants = jest
                .fn()
                .mockRejectedValueOnce({ message: 'Test', code: 'Code' });
            await store.loadRoomAndBoardData();

            store.goToAmendRoomAndBoardPage();

            expect(store.rootStore.routerStore.redirectToAmendRoomAndBoardPage).not.toHaveBeenCalled();
        });

        it('Should not redirect to amend room and board page when there are no cached room variants', async () => {
            bookingService.getAmendRoomAndBoardVariants = jest.fn().mockResolvedValue({ roomVariants: [] });
            await store.loadRoomAndBoardData();

            store.goToAmendRoomAndBoardPage();

            expect(store.rootStore.routerStore.redirectToAmendRoomAndBoardPage).not.toHaveBeenCalled();
        });

        it('Should setAreVariantsUnavailable be called when appropriate error code', () => {
            store.error = {
                code: ApiErrors.RoomAndBoardVariantsUnavailable,
                message: 'error message',
            };
            store.setAreVariantsUnavailable = jest.fn();

            store.goToAmendRoomAndBoardPage();

            expect(store.setAreVariantsUnavailable).toHaveBeenCalledWith(true);
        });

        it('Should call trackNoAvailabilityError method when error has RoomAndBoardVariantsUnavailable code', () => {
            store.error = {
                code: ApiErrors.RoomAndBoardVariantsUnavailable,
                message: 'message',
            };

            store.goToAmendRoomAndBoardPage();

            expect(store.rootStore.trackingStore.roomAndBoard.trackNoAvailabilityError).toHaveBeenCalled();
        });
    });

    describe('applyError', () => {
        it('Should apply error', () => {
            const error = { message: 'message', errorCode: ApiErrors.CancelPaymentError };
            store.applyError(error);

            expect(store.error).toStrictEqual({ message: 'message', code: ApiErrors.CancelPaymentError });
        });

        it('Should assign error data from error.response.data', () => {
            const error = { error: 'message', code: ApiErrors.CancelPaymentError };

            store.applyError(error);

            expect(store.error).toStrictEqual({ message: 'message', code: ApiErrors.CancelPaymentError });
        });

        it('should not apply error if it is a cancel error', () => {
            mockIsCancel = true;

            store.applyError({});

            expect(store.error).toBeNull();
        });
    });

    describe('setAreVariantsUnavailable', () => {
        it('Should areRoomAndBoardVariantsUnavailable be assigned', () => {
            store.setAreVariantsUnavailable(true);

            expect(store.areRoomAndBoardVariantsUnavailable).toBe(true);
        });
    });

    describe('clearStore', () => {
        it('Should clear store properties', () => {
            store.error = { message: 'Test', code: 'Code' };
            store.roomVariants = [];
            store.setAreVariantsUnavailable = jest.fn();
            store.upgradePrice = 10;
            store.isFreeChildPlaceVariantIncluded = true;

            store.clearStore();

            expect(store.error).toBe(null);
            expect(store.roomVariants.length).toBe(0);
            expect(store.upgradePrice).toBe(0);
            expect(store.isFreeChildPlaceVariantIncluded).toBe(false);
            expect(store.setAreVariantsUnavailable).toHaveBeenCalledWith(false);
        });
    });

    describe('changeRoom', () => {
        it('Should apply new value', () => {
            store.roomVariants = [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant];
            expect(store.chosenRoomVariant).toBe(null);

            store.changeRoom(mockUnitRoom);

            expect(store.chosenRoomVariant).toStrictEqual(mockRoomAndBoardRoomVariant);
        });
    });

    describe('constructAltBoardsFromRoomVariants', () => {
        it('Should return 1 result when duplicate board code', () => {
            store.chosenRoomVariant = {
                ...mockRoomAndBoardRoomVariant,
                units: [{ ...mockRoomAndBoardRoomVariant.units[0], code: 'test', isFreeForKids: true }],
            };

            const result = store.constructAltBoardsFromRoomVariants([
                mockRoomAndBoardRoomVariant,
                mockRoomAndBoardRoomVariant,
            ]);

            expect(result.length).toBe(1);
            expect(result[0]).toStrictEqual({
                code: 'boardType_code',
                title: 'boardType_title',
                itemName: 'boardType_title',
                name: 'boardType_name',
                content: 'boardType_content',
                description: 'boardType_description',
                iconUrl: 'boardType_icon',
                price: 14,
                pricePP: 7,
                isFreeForKids: true,
            });
        });

        it('Should only return boards for currently selected room', () => {
            store.chosenRoomVariant = {
                ...mockRoomAndBoardRoomVariant,
                units: [
                    {
                        ...mockRoomAndBoardRoomVariant.units[0],
                        code: 'test-unit-code',
                        boardType: { ...mockRoomAndBoardRoomVariant.units[0].boardType, code: 'test' },
                    },
                ],
            };

            const result = store.constructAltBoardsFromRoomVariants([
                mockRoomAndBoardRoomVariant,
                {
                    ...mockRoomAndBoardRoomVariant,
                    units: [
                        {
                            ...mockRoomAndBoardRoomVariant.units[0],
                            code: 'test-unit-code-1',
                            boardType: { ...mockRoomAndBoardRoomVariant.units[0].boardType, code: 'test-1' },
                        },
                    ],
                },
            ]);

            expect(result.length).toBe(1);
        });

        it('Should return 0 results when no chosen room variant', () => {
            const result = store.constructAltBoardsFromRoomVariants([
                mockRoomAndBoardRoomVariant,
                {
                    ...mockRoomAndBoardRoomVariant,
                    units: [
                        {
                            ...mockRoomAndBoardRoomVariant.units[0],
                            code: 'test-unit-code-1',
                            boardType: { ...mockRoomAndBoardRoomVariant.units[0].boardType, code: 'test-1' },
                        },
                    ],
                },
            ]);

            expect(result.length).toBe(0);
        });

        it('Should return chosen board first', () => {
            store.chosenRoomVariant = {
                ...mockRoomAndBoardRoomVariant,
                units: [
                    {
                        ...mockRoomAndBoardRoomVariant.units[0],
                        code: 'test-unit-code',
                        boardType: { ...mockRoomAndBoardRoomVariant.units[0].boardType, code: 'test' },
                    },
                ],
            };

            const result = store.constructAltBoardsFromRoomVariants([
                mockRoomAndBoardRoomVariant,
                {
                    ...mockRoomAndBoardRoomVariant,
                    units: [
                        {
                            ...mockRoomAndBoardRoomVariant.units[0],
                            code: 'test-unit-code-1',
                            boardType: { ...mockRoomAndBoardRoomVariant.units[0].boardType, code: 'test-1' },
                        },
                    ],
                },
            ]);

            expect(result[0].code).toBe('test');
        });
    });

    describe('validateRoomVariants', () => {
        describe('With populated cached room variants', () => {
            beforeEach(async () => {
                bookingService.getAmendRoomAndBoardVariants = jest
                    .fn()
                    .mockResolvedValueOnce({ roomVariants: [mockRoomAndBoardRoomVariant] });

                await store.loadRoomAndBoardData();
            });

            it('Should update variant list and sort by price', async () => {
                const mockRoomVariants = [
                    { ...mockRoomAndBoardRoomVariant, amendmentCharges: 100 },
                    { ...mockRoomAndBoardRoomVariant, amendmentCharges: 90 },
                    { ...mockRoomAndBoardRoomVariant, amendmentCharges: 80 },
                ];
                store.constructAltBoardsFromRoomVariants = jest.fn().mockImplementation(data => data);
                const breakRequestSpy = jest.spyOn(store, 'cancelRequests');

                store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
                store.error = { message: 'message', code: '400' };
                bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockReturnValueOnce(mockRoomVariants);

                await store.validateRoomVariants();

                expect(store.roomVariants[0].amendmentCharges).toBe(-1578);
                expect(store.roomVariants[1].amendmentCharges).toBe(80);
                expect(store.roomVariants[2].amendmentCharges).toBe(90);
                expect(store.roomVariants[3].amendmentCharges).toBe(100);
                expect(bookingService.amendRoomAndBoardValidateOffer).toHaveBeenCalledWith(
                    mockRoomAndBoardRoomVariant,
                    [mockRoomAndBoardRoomVariant],
                    'bookingReference',
                    undefined,
                    'token',
                );
                expect(store.error).toBe(null);
                expect(breakRequestSpy).toHaveBeenCalled();
            });

            it('Should set altBoard', async () => {
                const mockRoomVariants = [
                    { ...mockRoomAndBoardRoomVariant, amendmentCharges: 100 },
                    { ...mockRoomAndBoardRoomVariant, amendmentCharges: 90 },
                    { ...mockRoomAndBoardRoomVariant, amendmentCharges: 80 },
                ];

                store.constructAltBoardsFromRoomVariants = jest.fn().mockImplementation(data => data);
                store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
                bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockReturnValueOnce(mockRoomVariants);

                await store.validateRoomVariants();

                expect(store.constructAltBoardsFromRoomVariants).toHaveBeenCalledWith(store.roomVariants);
                expect(store.altBoards).toStrictEqual(store.roomVariants);
            });

            it('Should set areOptionsNotValidated when there are no validated options', async () => {
                store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
                bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockReturnValueOnce([]);

                await store.validateRoomVariants();

                expect(store.areOptionsNotValidated).toBe(true);
            });

            it('Should NOT be called if no chosen variant', async () => {
                store.chosenRoomVariant = null;
                bookingService.amendRoomAndBoardValidateOffer = jest.fn();

                await store.validateRoomVariants();

                expect(bookingService.amendRoomAndBoardValidateOffer).not.toHaveBeenCalled();
            });

            it('Should NOT be called if no booking', async () => {
                store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
                store.rootStore.viewBookingStore.booking = null;
                bookingService.amendRoomAndBoardValidateOffer = jest.fn();

                await store.validateRoomVariants();

                expect(bookingService.amendRoomAndBoardValidateOffer).not.toHaveBeenCalled();
            });

            it('Should catch an error', async () => {
                store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
                const error = { message: 'error-message', code: 'error-code' };
                bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockRejectedValueOnce(error);

                await store.validateRoomVariants();

                expect(store.error).toStrictEqual(error);
            });

            it('Should call trackNoAvailabilityError method when no available variants', async () => {
                jest.mocked(bookingService.amendRoomAndBoardValidateOffer).mockResolvedValueOnce([]);

                await store.validateRoomVariants();

                expect(store.rootStore.trackingStore.roomAndBoard.trackNoAvailabilityError).toHaveBeenCalled();
            });
        });

        it('Should set isFreeChildPlaceVariantIncluded to true when any variant contains free child place', async () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.cachedRoomVariants = [mockRoomAndBoardRoomVariant];
            const mockVariant = deepClone(mockRoomAndBoardRoomVariant);
            mockVariant.units[0].isFreeForKids = true;
            jest.mocked(bookingService.amendRoomAndBoardValidateOffer).mockResolvedValueOnce([mockVariant]);

            await store.validateRoomVariants();

            expect(store.isFreeChildPlaceVariantIncluded).toBe(true);
        });

        it('Should NOT be called if no cached variants', async () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            bookingService.amendRoomAndBoardValidateOffer = jest.fn();

            await store.validateRoomVariants();

            expect(bookingService.amendRoomAndBoardValidateOffer).not.toHaveBeenCalled();
        });
    });

    describe('changeBoardType', () => {
        it('should change room and validate room variants', async () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.altBoards = [mockRoomAndBoardRoomVariant.units[0].boardType];
            store.roomVariants = mockedRoomVariants;
            store.changeRoom = jest.fn();
            const callback = jest.fn();

            store.validateRoomVariants = jest.fn();

            await store.changeBoardType(mockRoomAndBoardRoomVariant.units[0].boardType.code, 0, callback);

            expect(store.changeRoom).toHaveBeenCalledWith(mockRoomAndBoardRoomVariant.units[0]);

            expect(store.validateRoomVariants).toHaveBeenCalled();
            expect(callback).toHaveBeenCalled();
        });

        it('should catch an error when validateRoomVariants fails', async () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.altBoards = [mockRoomAndBoardRoomVariant.units[0].boardType];
            store.roomVariants = mockedRoomVariants;
            store.changeRoom = jest.fn();
            const callback = jest.fn();
            const error = { message: 'error-message', code: 'error-code' };
            store.validateRoomVariants = jest.fn().mockRejectedValueOnce(error);

            await store.changeBoardType(mockRoomAndBoardRoomVariant.units[0].boardType.code, 0, callback);

            expect(store.error).toStrictEqual(error);
        });

        it('should catch an error if no board found', async () => {
            store.changeRoom = jest.fn();
            store.validateRoomVariants = jest.fn();
            await store.changeBoardType('test', 0, jest.fn());

            expect(store.changeRoom).not.toHaveBeenCalled();
            expect(store.validateRoomVariants).not.toHaveBeenCalled();
            expect(store.error).toStrictEqual({ message: 'Board not found', code: undefined });
        });

        it('should catch an error if no room found', async () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.altBoards = [mockRoomAndBoardRoomVariant.units[0].boardType];
            store.changeRoom = jest.fn();
            const callback = jest.fn();

            store.validateRoomVariants = jest.fn();

            await store.changeBoardType(mockRoomAndBoardRoomVariant.units[0].boardType.code, 0, callback);

            expect(store.changeRoom).not.toHaveBeenCalled();
            expect(store.validateRoomVariants).not.toHaveBeenCalled();
            expect(store.error).toStrictEqual({ message: 'Room not found', code: undefined });
        });
    });

    describe('confirmChosenVariant', () => {
        it('should invoke submitForm function', () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.roomVariants = [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant];
            store.confirmChosenVariant();

            expect(submitForm).toHaveBeenCalledWith(
                '/booking/amend-payment',
                'amend-payment-payload',
                expect.objectContaining({
                    amendRoomAndBoardOffer: {
                        selectedRoomVariant: mockRoomAndBoardRoomVariant,
                    },
                    billingInfo: {
                        fullName: mockBillingInfo.fullName,
                        address: userLoginMockInfo.address1,
                        address2: userLoginMockInfo.address2,
                        city: userLoginMockInfo.city,
                        postCode: userLoginMockInfo.postalCode,
                    },
                }),
            );
        });

        it('submitForm should be called without billing info when userData is not defined', () => {
            (store.rootStore.userStore as any).billingInfo = undefined;
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.roomVariants = [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant];
            store.confirmChosenVariant();

            expect(submitForm).toHaveBeenCalledWith('/booking/amend-payment', 'amend-payment-payload', {
                ...getBookingPayload(mockBooking),
                amendRoomAndBoardOffer: {
                    selectedRoomVariant: mockRoomAndBoardRoomVariant,
                },
            });
        });

        it('should append ?ecp=fph to amend-payment url when in FPH funnel', () => {
            (store.rootStore as any).queryParamsStore = {
                ...store.rootStore.queryParamsStore,
                isFlightPlusHotelFunnel: true,
            };
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.roomVariants = [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant];
            store.confirmChosenVariant();

            expect(submitForm).toHaveBeenCalledWith(
                '/booking/amend-payment?ecp=fph',
                'amend-payment-payload',
                expect.objectContaining({
                    amendRoomAndBoardOffer: {
                        selectedRoomVariant: mockRoomAndBoardRoomVariant,
                    },
                }),
            );
        });

        it('Should call confirm tracking event', () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            store.confirmChosenVariant();

            expect(store.rootStore.trackingStore.roomAndBoard.trackRoomAndBoardConfirmClick).toHaveBeenCalledWith(
                EventTypes.PostBookingChangeBoardUpdate,
            );
            expect(store.rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();
        });

        it('should return when no chosen variant', () => {
            store.chosenRoomVariant = null;
            store.confirmChosenVariant();

            expect(submitForm).not.toHaveBeenCalled();
        });
    });

    describe('canLoadRoomAndBoardOptions', () => {
        it('should return false when isAmendCTADisabled is true', () => {
            jest.spyOn(store, 'isAmendCTADisabled', 'get').mockReturnValueOnce(true);

            expect(store.canLoadRoomAndBoardOptions).toBe(false);
        });

        it('should return false when not logged in as lead passenger', () => {
            store.rootStore.viewBookingStore.booking = {
                ...mockBooking,
                isLoggedInAsLeadPassenger: false,
            };

            expect(store.canLoadRoomAndBoardOptions).toBe(false);
        });

        it('should return false when isAmendCTAVisible is false', () => {
            jest.spyOn(store, 'isAmendCTAVisible', 'get').mockReturnValueOnce(false);

            expect(store.canLoadRoomAndBoardOptions).toBe(false);
        });

        it('should return true when all conditions are met', () => {
            expect(store.canLoadRoomAndBoardOptions).toBe(true);
        });
    });

    describe('loadRoomAndBoardDataFromPayload', () => {
        beforeEach(() => {
            store.rootStore.appStore.amendBookingItemPayload = {
                amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
                ...mockAmendBookingPayload,
            };
        });

        it('Should amendRoomAndBoardValidateOffer be called with default variant when have no selectedRoomVariant in payload', async () => {
            (
                bookingService.getAmendRoomAndBoardVariants as jest.MockedFn<
                    typeof bookingService.getAmendRoomAndBoardVariants
                >
            ).mockResolvedValueOnce({ roomVariants: [mockRoomAndBoardRoomVariant], upsellAmount: 0 });
            (
                bookingService.amendRoomAndBoardValidateOffer as jest.MockedFn<
                    typeof bookingService.amendRoomAndBoardValidateOffer
                >
            ).mockResolvedValueOnce([mockRoomAndBoardRoomVariant]);

            store.rootStore.viewBookingStore.booking = mockBooking;

            await store.loadRoomAndBoardDataFromPayload();

            expect(bookingService.amendRoomAndBoardValidateOffer).toHaveBeenCalledWith(
                store.defaultVariant,
                [mockRoomAndBoardRoomVariant],
                'bookingReference',
                undefined,
                'token',
            );
        });

        it('should call viewBooking initBookingFromPayload and call success callback', async () => {
            const mockedRoomVariants = [{ ...mockRoomAndBoardRoomVariant, fullAmendmentCharges: 500 }];
            store.rootStore.appStore.amendBookingItemPayload!.amendRoomAndBoardOffer!.selectedRoomVariant =
                mockRoomAndBoardRoomVariant;
            store.loadRoomAndBoardData = jest.fn();
            store.validateRoomVariants = jest.fn().mockImplementationOnce(() => {
                store.roomVariants = mockedRoomVariants;
            });

            await store.loadRoomAndBoardDataFromPayload();

            expect(store.rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();
            expect(store.loadRoomAndBoardData).toHaveBeenCalled();
            expect(store.validateRoomVariants).toHaveBeenCalled();
        });

        it('should set selectedOptionIsUnavailable to true when chosenRoomVariant is not validated and set chosenRoomVariant to default', async () => {
            store.validateRoomVariants = jest.fn().mockImplementationOnce(() => {
                store.roomVariants = [];
            });

            await store.loadRoomAndBoardDataFromPayload();

            waitFor(() => expect(store.chosenRoomVariant).toStrictEqual(store.defaultVariant));
        });

        it('success callback should return early if no amendBookingPayload', async () => {
            store.rootStore.appStore.amendBookingItemPayload = undefined;
            store.loadRoomAndBoardData = jest.fn();
            store.validateRoomVariants = jest.fn();

            await store.loadRoomAndBoardDataFromPayload();

            expect(store.loadRoomAndBoardData).not.toHaveBeenCalled();
            expect(store.validateRoomVariants).not.toHaveBeenCalled();
        });

        it('success callback should return early if no amendBookingPayload amendRoomAndBoardOffer', async () => {
            store.rootStore.appStore.amendBookingItemPayload!.amendRoomAndBoardOffer = undefined;
            store.loadRoomAndBoardData = jest.fn();
            store.validateRoomVariants = jest.fn();

            await store.loadRoomAndBoardDataFromPayload();

            expect(store.loadRoomAndBoardData).not.toHaveBeenCalled();
            expect(store.validateRoomVariants).not.toHaveBeenCalled();
        });

        it('should handle error', async () => {
            const error = { message: 'test' };
            store.loadRoomAndBoardData = jest.fn().mockRejectedValueOnce(error);

            await store.loadRoomAndBoardDataFromPayload();

            expect(store.rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();
            expect(store.error).toEqual(error);
        });
    });

    describe('chosenBoard', () => {
        it('Should return a board object from chosenVariant', () => {
            store.chosenRoomVariant = mockRoomAndBoardRoomVariant;

            expect(store.chosenBoard).toStrictEqual({
                ...mockRoomAndBoardRoomVariant.units[0].boardType,
                isFreeForKids: mockRoomAndBoardRoomVariant.units[0].isFreeForKids,
            });
        });

        it('Should return null if no chosenVariant', () => {
            store.chosenRoomVariant = null;

            expect(store.chosenBoard).toStrictEqual(null);
        });
    });
});
