import * as envs from 'code/env';
import { mockBooking } from 'frontend/__mocks__';
import { TRootStore } from 'frontend/store/IStores';
import * as offerUtils from 'frontend/utils/offer.utils';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { AmendmentType, IBookingInfo, IBookingInfoPayload } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import BaseViewBookingStore, { IBaseViewBookingStoreInitialState } from './BaseViewBookingStore';

jest.mock('frontend/utils/route.utils', () => ({
    getFlightDigitalNumber: jest.fn(),
}));

jest.mock('frontend/utils/viewBooking.utils');

const mockPayload = { bookinfReference: '000000', lastName: 'Test', date: new Date().toISOString() };
jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(() => mockPayload),
    setWebStorageItem: jest.fn(),
}));

const transport = {
    routes: [
        {
            arrDate: '2020-09-02T16:25:00+00:00',
            arrLocation: 'Croatia',
            arrName: 'Split Airport',
            arrPt: 'SPU',
            arrTime: '1625',
            avail: 84,
            car: 'EZY',
            cycDate: '2020-09-02',
            depDate: '2020-09-02T13:00:00+00:00',
            depLocation: 'London',
            depName: 'London Gatwick',
            depPt: 'LGW',
            depTime: '1300',
            direction: 'outbound',
            fltNo: 'EZY8395',
            id: 'Eaf170684b65f1e91ddcff8f737f8f07f',
            isExt: true,
            routeCd: 'SPULGW3T',
        },
        {
            arrDate: '2020-09-08T14:10:00+00:00',
            arrLocation: 'London',
            arrName: 'London Gatwick',
            arrPt: 'LGW',
            arrTime: '1410',
            avail: 147,
            car: 'EZY',
            cycDate: '2020-09-08',
            depDate: '2020-09-08T12:30:00+00:00',
            depLocation: 'Croatia',
            depName: 'Split Airport',
            depPt: 'SPU',
            depTime: '1230',
            direction: 'inbound',
            fltNo: 'EZY8398',
            id: 'Ea0e3d4ed50d28b03399b3308532cabc1',
            isExt: true,
            routeCd: 'SPULGW2T',
        },
    ],
};

const seatSelection = [{ isSeatReservationPossible: true }, { isSeatReservationPossible: true }];

const createRootStore = () =>
    ({
        seatMapStore: {
            setValidatedSelectedSeats: jest.fn(),
            clearValidatedSeats: jest.fn(),
        },
        flightsPassengersStore: {
            setPassengersStore: jest.fn(),
        },
        marketStore: { marketCode: 'UK' },
    } as any);

let rootStore;
let store;

describe('BaseViewBookingStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
        store = new BaseViewBookingStore(rootStore as TRootStore);
    });

    describe('MicroApp feature flags', () => {
        beforeAll(() => {
            jest.spyOn(envs, 'getEnvAll').mockReturnValue({
                MANAGE_MY_HOLIDAY_ENABLED: false,
                AMEND_TRANSFER_FLOW_ENABLED: false,
                AMEND_FLIGHT_FLOW_ENABLED: false,
                AMEND_DATE_FLOW_ENABLED: false,
                AMEND_ROOM_AND_BOARD_FLOW_ENABLED: false,
                AMEND_MULTI_ROOM_AND_BOARD_FLOW_ENABLED: false,
                AMEND_SEAT_FLOW_ENABLED: false,
                AMEND_HOTEL_FLOW_ENABLED: false,
                AMEND_NAME_FLOW_ENABLED: false,
                B2B_AMENDMENTS_ENABLED: false,
            } as ReturnType<typeof envs.getEnvAll>);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it.each([
            ['isMicroAppManageMyHolidayAllowed', 'MANAGE_MY_HOLIDAY_ENABLED'],
            ['isMicroAppAmendTransferAllowed', 'AMEND_TRANSFER_FLOW_ENABLED'],
            ['isMicroAppAmendFlightsAllowed', 'AMEND_FLIGHT_FLOW_ENABLED'],
            ['isMicroAppAmendDateAllowed', 'AMEND_DATE_FLOW_ENABLED'],
            ['isMicroAppAmendRoomAndBoardAllowed', 'AMEND_ROOM_AND_BOARD_FLOW_ENABLED'],
            ['isMicroAppAmendMultiRoomAndBoardAllowed', 'AMEND_MULTI_ROOM_AND_BOARD_FLOW_ENABLED'],
            ['isMicroAppAmendSeatsAllowed', 'AMEND_SEAT_FLOW_ENABLED'],
            ['isMicroAppAmendHotelAllowed', 'AMEND_HOTEL_FLOW_ENABLED'],
            ['isMicroAppAmendNameAllowed', 'AMEND_NAME_FLOW_ENABLED'],
        ])('should return true when %s flag is enabled and not luxury', (getter, flag) => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({ [flag]: true });
            jest.spyOn(store, 'isLuxuryPackage', 'get').mockReturnValue(false);
            expect((store as BaseViewBookingStore)[getter]).toBe(true);
        });

        it.each([
            ['isMicroAppManageMyHolidayAllowed', 'MANAGE_MY_HOLIDAY_ENABLED'],
            ['isMicroAppAmendTransferAllowed', 'AMEND_TRANSFER_FLOW_ENABLED'],
            ['isMicroAppAmendFlightsAllowed', 'AMEND_FLIGHT_FLOW_ENABLED'],
            ['isMicroAppAmendDateAllowed', 'AMEND_DATE_FLOW_ENABLED'],
            ['isMicroAppAmendRoomAndBoardAllowed', 'AMEND_ROOM_AND_BOARD_FLOW_ENABLED'],
            ['isMicroAppAmendMultiRoomAndBoardAllowed', 'AMEND_MULTI_ROOM_AND_BOARD_FLOW_ENABLED'],
            ['isMicroAppAmendSeatsAllowed', 'AMEND_SEAT_FLOW_ENABLED'],
            ['isMicroAppAmendHotelAllowed', 'AMEND_HOTEL_FLOW_ENABLED'],
            ['isMicroAppAmendNameAllowed', 'AMEND_NAME_FLOW_ENABLED'],
        ])('should return false when package is luxury even if %s flag is enabled', (getter, flag) => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({ [flag]: true });
            jest.spyOn(store, 'isLuxuryPackage', 'get').mockReturnValue(true);
            expect((store as BaseViewBookingStore)[getter]).toBe(false);
        });
    });

    describe('serialize', () => {
        it('should return initial state object', () => {
            store.viewBookingPayload = { hasAmendedFlights: true } as any;

            expect(store.serialize()).toEqual({
                viewBookingPayload: { hasAmendedFlights: true },
            });
        });
    });

    describe('deserialize', () => {
        it('should do nothing if no initialState', () => {
            store.deserialize();

            expect(store.viewBookingPayload).toBeUndefined();
        });

        it('should initialize store using initial state', () => {
            const initialState: IBaseViewBookingStoreInitialState = {
                viewBookingPayload: { hasAmendedFlights: true } as any,
            };

            store.deserialize(initialState);

            expect(store.viewBookingPayload).toEqual({ hasAmendedFlights: true });
        });
    });

    it('outboundFlight should return outbound flight from booking', () => {
        store.booking = {
            package: { transport },
        } as any;

        expect(store.outboundFlight).toEqual(transport.routes[0]);
    });

    it('inboundFlight should return inbound flight from booking', () => {
        store.booking = {
            package: { transport },
        } as any;

        expect(store.inboundFlight).toEqual(transport.routes[1]);
    });

    it('outboundFlightNumber should getFlightDigitalNumber with outbound flight', () => {
        store.booking = { transport } as any;

        store.outboundFlightNumber;

        expect(getFlightDigitalNumber).toBeCalledWith(store.outboundFlight);
    });

    it('inboundFlightNumber should call getFlightDigitalNumber with inbound flight', () => {
        store.booking = { transport } as any;

        store.outboundFlightNumber;

        expect(getFlightDigitalNumber).toBeCalledWith(store.outboundFlight);
    });

    describe('isBookingOutOfSync', () => {
        beforeEach(() => {
            store.booking = {
                package: { transport },
                seatSelection,
            };
        });

        it('should return false when isSeatReservationPossible === true', () => {
            expect(store.isBookingOutOfSync).toBe(false);
        });

        it('should return true when isSeatReservationPossible === false', () => {
            store.booking.seatSelection[0].isSeatReservationPossible = false;
            expect(store.isBookingOutOfSync).toBe(true);
        });
    });

    describe('isFlightExternal', () => {
        beforeEach(() => {
            store.booking = {
                package: { transport },
            };
        });

        it('should return true if either of the flights is external', () => {
            expect(store.isFlightExternal).toBe(true);
        });

        it('should return false if neither of the flights is external', () => {
            store.booking.package.transport.routes[0].isExt = false;

            expect(store.isFlightExternal).toBe(false);
        });
    });

    describe('baseUpdateBookingInfo', () => {
        it('should correctly proceed non empty booking', () => {
            const booking = {
                bookingStatus: BookingStatus.Canceled,
                seatSelection: undefined,
            } as IBookingInfo;

            store.setRefreshBookingPayloadToStorage = jest.fn();

            expect(store.isBookingCanceled).toBe(false);
            expect(store.booking).toBeNull();

            store.baseUpdateBookingInfo(booking);

            expect(rootStore.flightsPassengersStore.setPassengersStore).toBeCalledWith(booking);
            expect(rootStore.seatMapStore.setValidatedSelectedSeats).not.toBeCalled();
            expect(store.booking).toEqual(booking);
            expect(store.isBookingCanceled).toBe(true);

            expect(store.setRefreshBookingPayloadToStorage).toHaveBeenCalledWith(booking);
        });

        it('should setValidatedSelectedSeats', () => {
            const booking = {
                bookingStatus: BookingStatus.Canceled,
                seatSelection: {},
            } as IBookingInfo;

            store.baseUpdateBookingInfo(booking);

            expect(rootStore.seatMapStore.setValidatedSelectedSeats).toBeCalledWith(booking.seatSelection);
        });

        it('should set Booking is not Canceled', () => {
            const booking = {
                bookingStatus: 'ok',
            } as IBookingInfo;

            store.isBookingCanceled = true;

            store.baseUpdateBookingInfo(booking);

            expect(store.isBookingCanceled).toBe(false);
        });

        it('should correctly proceed empty booking', () => {
            const booking = null;

            store.isBookingCanceled = true;
            store.booking = {} as any;

            store.baseUpdateBookingInfo(booking);

            expect(store.booking).toBeNull();
            expect(rootStore.seatMapStore.clearValidatedSeats).toBeCalled();
            expect(rootStore.seatMapStore.setValidatedSelectedSeats).not.toBeCalled();
            expect(rootStore.flightsPassengersStore.setPassengersStore).not.toBeCalled();

            expect(store.isBookingCanceled).toBe(false);
        });
    });

    it('should set isAmendErrorPopupShown when toggleAmendErrorPopup is called', () => {
        store.isAmendErrorPopupShown = false;
        expect(store.isAmendErrorPopupShown).toBe(false);
        store.toggleAmendErrorPopup(true);

        expect(store.isAmendErrorPopupShown).toBe(true);
    });

    it('should set isHelpPopupShown when toggleHelpPopup is called', () => {
        store.isHelpPopupShown = false;
        expect(store.isHelpPopupShown).toBe(false);
        store.toggleHelpPopup(true);

        expect(store.isHelpPopupShown).toBe(true);
    });

    it('should set successfulAmendmentStatus when setSuccessfulAmendmentStatus is called', () => {
        expect(store.successfulAmendmentStatus).toBe(null);

        store.setSuccessfulAmendmentStatus(AmendmentType.Dates);

        expect(store.successfulAmendmentStatus).toBe(AmendmentType.Dates);
    });

    describe('refreshBookingPayloadFromStorage', () => {
        it('should read payload from session storage on readRefreshBookingPayloadFromStorage call', () => {
            jest.mocked(getWebStorageItem).mockReturnValue(mockPayload);

            store.readRefreshBookingPayloadFromStorage();
            expect(getWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.BookingPayload, true, sessionStorage);
            expect(store.refreshBookingPayloadFromStorage).toEqual(mockPayload);
        });

        it('should set payload to session storage on setRefreshBookingPayloadToStorage call', () => {
            (getBookingPayload as jest.MockedFn<typeof getBookingPayload>).mockReturnValue({} as IBookingInfoPayload);

            store.setRefreshBookingPayloadToStorage(mockBooking);

            expect(getBookingPayload).toHaveBeenCalledWith(mockBooking);
            expect(setWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.BookingPayload, {}, sessionStorage);
        });
    });

    describe('isLuxuryPackage', () => {
        it('should return true when it is luxury offer', () => {
            jest.spyOn(offerUtils, 'containsLuxuryPromoCode').mockReturnValue(true);
            expect(store.isLuxuryPackage).toBe(true);
        });

        it('should return false when it is NOT luxury offer', () => {
            jest.spyOn(offerUtils, 'containsLuxuryPromoCode').mockReturnValue(false);
            expect(store.isLuxuryPackage).toBe(false);
        });
    });

    describe('isMicroAppManageMyHolidayAllowed', () => {
        it('should return false when marketCode is not UK', () => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({
                MANAGE_MY_HOLIDAY_ENABLED: true,
            });

            rootStore.marketStore = { marketCode: 'DE' };
            expect(store.isMicroAppManageMyHolidayAllowed).toBe(false);
        });

        it('should return true when marketCode is UK and not luxury', () => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({
                MANAGE_MY_HOLIDAY_ENABLED: true,
            });

            rootStore.marketStore = { marketCode: 'UK' };
            expect(store.isMicroAppManageMyHolidayAllowed).toBe(true);
        });

        it('should return false when package is luxury even if flag is enabled for UK market', () => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({
                MANAGE_MY_HOLIDAY_ENABLED: true,
            });
            jest.spyOn(store, 'isLuxuryPackage', 'get').mockReturnValue(true);
            rootStore.marketStore = { marketCode: 'UK' };
            expect(store.isMicroAppManageMyHolidayAllowed).toBe(false);
        });
    });

    describe('isB2BAmendmentAllowed', () => {
        it('should return true when B2B_AMENDMENTS_ENABLED = true', () => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({
                B2B_AMENDMENTS_ENABLED: true,
            });

            expect(store.isB2BAmendmentAllowed).toBe(true);
        });

        it('should return false when B2B_AMENDMENTS_ENABLED = false', () => {
            (envs.getEnvAll as jest.Mock).mockReturnValue({
                B2B_AMENDMENTS_ENABLED: false,
            });

            expect(store.isB2BAmendmentAllowed).toBe(false);
        });
    });

    describe('clearViewBookingPayload', () => {
        it('Should clear booking payload', () => {
            store.viewBookingPayload = mockBooking;

            store.clearViewBookingPayload();

            expect(store.viewBookingPayload).toBeNull();
        });
    });
});
