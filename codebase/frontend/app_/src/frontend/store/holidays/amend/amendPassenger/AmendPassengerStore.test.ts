import { createMockStores, mockBrowserInfo } from 'frontend/__mocks__';
import { mockGuests as guests } from 'frontend/__mocks__/guests';
import bookingService from 'frontend/services/booking.service';
import { AmendPassengerStore } from 'frontend/store/holidays/amend/amendPassenger/AmendPassengerStore';
import { generateTransactionId } from 'frontend/utils/paymentTransaction';
import AxiosRequest from 'frontend/utils/request';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

import { AMEND_PASSENGERS_DISABLED_STATUSES } from './constants';

const mockGuests = guests;

jest.mock('frontend/utils/paymentTransaction');
jest.mock('frontend/services/booking.service', () => ({
    amendCommitBooking: jest.fn(() =>
        Promise.resolve({
            data: {
                guests: mockGuests,
            },
        }),
    ),
}));

jest.mock('frontend/utils/request');

(AxiosRequest.post as jest.Mock).mockResolvedValue({
    data: [
        {
            paxId: '1',
            canBeChanged: true,
        },
        {
            paxId: '2',
            canBeChanged: false,
        },
        {
            paxId: '3',
            canBeChanged: true,
        },
    ],
});

const mockBooking = {
    amendmentInfo: {
        amendBookingStatus: [],
        pax: {
            amendAllow: true,
            amendNameOnly: true,
        },
    },
    bookingReference: '123',
    guests: mockGuests,
};

let store;

describe('AmendPassengerStore', () => {
    jest.mocked(generateTransactionId).mockReturnValue('transactionId');

    beforeEach(() => {
        store = new AmendPassengerStore(
            createMockStores({
                routerStore: {
                    redirectToViewBookingsPage: jest.fn(),
                    redirectTo: jest.fn(),
                    redirectToAmendPassengerPage: jest.fn(),
                },
                payStore: { isAtcomError: false },
                viewBookingStore: {
                    booking: mockBooking,
                    updateBookingInfo: jest.fn(),
                    amendBookingStatuses: [],
                },
                amendFlightsStore: {
                    allowanceRestrictions: {},
                },
                layoutStore: {
                    lang: 'en',
                },
            }),
        );
    });

    it('initAmendPassengerDetailsPage', async () => {
        store.booking = mockBooking as any;
        await store.initialize();

        expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalledTimes(0);

        store.updateStoreBooking();
        await store.initialize();

        expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
    });

    it('initAmendPassengerDetailsPage', () => {
        store.updateStoreBooking(mockBooking as any);

        expect(JSON.stringify(store.booking)).toBe(JSON.stringify(mockBooking));
    });

    it('canBeChanged for each guestsToEdit should match API response', async () => {
        store.booking = mockBooking as any;
        await store.initialize();

        expect(store.guestsToEdit[0].canChangeName).toBe(true);
        expect(store.guestsToEdit[1].canChangeName).toBe(false);
        expect(store.guestsToEdit[2].canChangeName).toBe(true);
    });

    it('canBeChanged for each guestsToEdit should default to true if not found in API response', async () => {
        (AxiosRequest.post as jest.Mock).mockResolvedValue({
            data: [],
        });

        store.booking = mockBooking as any;
        await store.initialize();

        expect(store.guestsToEdit[0].canChangeName).toBe(true);
        expect(store.guestsToEdit[1].canChangeName).toBe(true);
        expect(store.guestsToEdit[2].canChangeName).toBe(true);
    });

    it('error code should be set if API call fails', async () => {
        const error = {
            status: 400,
            code: 'error occurred',
        };
        (AxiosRequest.post as jest.Mock).mockRejectedValue({
            response: error,
        });

        store.booking = mockBooking as any;
        await store.initialize();

        expect(store.nameChangeValidationError).toEqual(error);
    });

    it('startEditPassengerDetails', () => {
        store.startEditPassengerDetails(mockBooking as any);

        expect(store.rootStore.routerStore.redirectToAmendPassengerPage).toHaveBeenCalled();
    });

    describe('Amend CTA State', () => {
        it('should not be visible when isLoggedInAsLeadPassenger is false and have disabled status', () => {
            store.rootStore.viewBookingStore.isLeadLoggedIn = false;
            store.rootStore.viewBookingStore.amendBookingStatuses = [AMEND_PASSENGERS_DISABLED_STATUSES[0]];

            expect(store.isAmendCTAVisible).toBe(false);
        });

        it('should not be visible when isLoggedInAsLeadPassenger is false and have disabled status with inventory error', () => {
            store.rootStore.viewBookingStore.isLeadLoggedIn = false;
            store.rootStore.viewBookingStore.amendBookingStatuses = [
                AMEND_PASSENGERS_DISABLED_STATUSES[0],
                AmendBookingStatus.AmendPassengerDisabledByInventoryError,
            ];

            expect(store.isAmendCTAVisible).toBe(false);
        });

        it('should be visible when only inventory error is present', () => {
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.hasInventoryError = true;
            store.rootStore.viewBookingStore.booking.amendmentInfo.amendBookingStatus = [
                AmendBookingStatus.AmendPassengerDisabledByInventoryError,
            ];

            expect(store.isAmendCTAVisible).toBe(true);
        });

        it('should be visible when lead passenger is logged in and allowed by pax', () => {
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.booking.isLoggedInAsLeadPassenger = true;
            store.rootStore.viewBookingStore.booking.amendmentInfo.pax = {
                amendAllow: true,
                amendNameOnly: true,
            };

            expect(store.isAmendCTAVisible).toBe(true);
        });

        it('should not be visible when no booking', () => {
            store.rootStore.viewBookingStore.booking = undefined;

            expect(store.isAmendCTAVisible).toBe(false);
        });

        it('should be visible but disabled when flight disabled by disruption', () => {
            ((store.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<AmendBookingStatus[]>) = [
                AmendBookingStatus.AmendPassengerDisabledByFlightDisruption,
            ]),
                expect(store.isAmendCTAVisible).toBe(true);
            expect(store.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled for Trade Booking', () => {
            store.rootStore.viewBookingStore.allowanceRestrictions.byExternalAgency = true;

            expect(store.isAmendCTAVisible).toBe(true);
            expect(store.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled for out of sync error', () => {
            (store.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<AmendBookingStatus[]>) = [
                AmendBookingStatus.AmendPassengerDisabledByOutOfSync,
            ];

            expect(store.isAmendCTAVisible).toBe(true);
            expect(store.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled because of airport parking', () => {
            (store.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<AmendBookingStatus[]>) = [
                AmendBookingStatus.AmendPassengerDisabledByAirportParking,
            ];

            expect(store.isAmendCTAVisible).toBe(true);
            expect(store.isAmendCTADisabled).toBe(true);
        });
    });

    describe('submitChanges', () => {
        it('should call amendCommitBooking with appropriate parameters', async () => {
            store.booking = mockBooking;
            const spy = jest.spyOn(bookingService, 'amendCommitBooking');
            await store.initialize();

            await store.submitChanges();

            expect(spy).toHaveBeenCalledWith(
                {
                    browserInfo: mockBrowserInfo,
                    bookingReference: mockBooking.bookingReference,
                    lastName: mockBooking.guests[0].lastName,
                    date: undefined,
                    paymentInfo: { amount: 0 },
                    passengers: mockBooking.guests,
                    deviceId: 'transactionId',
                },
                'transactionId',
            );
        });

        it('Submitting passenger details change should set isSuccessfullySubmitted to true and update booking details', async () => {
            store.booking = mockBooking;
            store.guestsToEdit = [
                {
                    initialDetails: {
                        title: 'Mr',
                        firstName: 'John',
                        lastName: 'Smith',
                    },
                    tempName: 'Johnny',
                    tempSurname: 'Smith',
                },
            ];
            await store.submitChanges();

            expect(store.rootStore.viewBookingStore.updateBookingInfo).toHaveBeenCalledWith({
                ...mockBooking,
                guests: mockGuests,
            });
            expect(store.isSuccessfullySubmitted).toBeTruthy();
        });

        it('Should catch an error, assign it and reload a booking', async () => {
            store.rootStore.viewBookingStore.loadBooking = jest.fn();
            store.booking = mockBooking;
            store.guestsToEdit = [];
            (bookingService.amendCommitBooking as jest.MockedFn<any>).mockImplementationOnce(() => {
                throw { response: 'response' };
            });

            await store.submitChanges();

            expect(store.submitError).toBe('response');
            expect(store.rootStore.viewBookingStore.loadBooking).toHaveBeenCalled();
        });
    });

    it('clearStore', () => {
        store.clearStore();

        expect(store.booking).toBe(null);
        expect(store.guestsToEdit).toEqual([]);
        expect(store.isSubmitPending).toBeFalsy();
        expect(store.isSuccessfullySubmitted).toBeFalsy();
        expect(store.isSubmitError).toBeFalsy();
    });

    it('resetSubmitError', () => {
        store.resetSubmitError();

        expect(store.isSubmitError).toBeFalsy();
    });

    describe('allowanceRestrictions', () => {
        it('should return byOutOfSync when passengers data is out of sync', () => {
            store.rootStore.viewBookingStore.amendBookingStatuses = [
                AmendBookingStatus.AmendPassengerDisabledByOutOfSync,
            ];

            expect(store.allowanceRestrictions.byOutOfSync).toBe(true);
        });

        it('should return byDisruption when booking has disrupted flight', () => {
            store.rootStore.viewBookingStore.amendBookingStatuses = [
                AmendBookingStatus.AmendPassengerDisabledByFlightDisruption,
            ];

            expect(store.allowanceRestrictions.byDisruption).toBe(true);
        });

        it('should return byAirportParking when booking has airport parking', () => {
            store.rootStore.viewBookingStore.amendBookingStatuses = [
                AmendBookingStatus.AmendPassengerDisabledByAirportParking,
            ];

            expect(store.allowanceRestrictions.byAirportParking).toBe(true);
        });
    });

    describe('haveUnsavedChanges', () => {
        it('Should return true when gust has been edited and not selected', () => {
            store.guestsToEdit = [{ isEdited: true, isSelected: false }];

            expect(store.haveUnsavedChanges).toBe(true);
        });

        it('Should return false when gust not has been edited and not selected', () => {
            store.guestsToEdit = [{ isEdited: false, isSelected: false }];

            expect(store.haveUnsavedChanges).toBe(false);
        });
    });

    describe('isChangePassengersCountAllowed', () => {
        it('Should return setting', () => {
            expect(store.isChangePassengersCountAllowed).toBe('IsAmendPassengerChangeCountEnabled');
        });
    });

    describe('isShowRestrictionInfoEnabled', () => {
        it('Should return setting', () => {
            expect(store.isShowRestrictionInfoEnabled).toBe('IsRestrictionInfoEnabled');
        });
    });

    describe('amendPassengerNameCharacterCount', () => {
        it('Should return setting', () => {
            expect(store.amendPassengerNameCharacterCount).toBe('AmendPassengerNameCharacterCount');
        });
    });
});
