import { mockBooking } from 'frontend/__mocks__/booking';
import * as routeUtils from 'frontend/utils/route.utils';
import * as viewBookingUtils from 'frontend/utils/viewBooking.utils';
import * as utils from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';

import { usePreparedBookingInfoData } from './BookingCardInfo.utils';

describe('usePreparedBookingInfoData', () => {
    it('should return checkInLink', () => {
        const checkInLink = 'CheckInLink';
        jest.spyOn(viewBookingUtils, 'getCheckInLink').mockReturnValueOnce(checkInLink);
        const data = usePreparedBookingInfoData(
            mockBooking,
            jest.fn(p => p),
        );

        expect(data.checkInLink).toStrictEqual(checkInLink);
    });

    it('should return true for isCheckInButtonDisplayed', () => {
        mockBooking.bookingReference = 'bookingReference' as any;
        mockBooking.guests[1].isLead = true;
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ isCanceled: false } as any);
        const data = usePreparedBookingInfoData(
            mockBooking,
            jest.fn(p => p),
        );

        expect(data.isCheckInButtonDisplayed).toStrictEqual(true);
    });

    it('should return false for isCheckInButtonDisplayed when isCancelled is true', () => {
        mockBooking.bookingReference = 'bookingReference' as any;
        mockBooking.guests[1].isLead = true;
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ isCanceled: true } as any);
        const data = usePreparedBookingInfoData(
            mockBooking,
            jest.fn(p => p),
        );

        expect(data.isCheckInButtonDisplayed).toStrictEqual(false);
    });

    it('should return false for isCheckInButtonDisplayed when checkInLink is NOT provided', () => {
        mockBooking.bookingReference = null as any;
        mockBooking.guests[1].isLead = true;
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ isCanceled: false } as any);
        const data = usePreparedBookingInfoData(
            mockBooking,
            jest.fn(p => p),
        );

        expect(data.isCheckInButtonDisplayed).toStrictEqual(false);
    });

    it('should return false for isCheckInButtonDisplayed when there are multiple flights', () => {
        mockBooking.bookingReference = 'bookingReference' as any;
        mockBooking.guests[1].isLead = true;
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ isCanceled: false } as any);
        jest.spyOn(routeUtils, 'getFlightsReferences').mockReturnValue([1, 2] as any);
        const data = usePreparedBookingInfoData(
            mockBooking,
            jest.fn(p => p),
        );

        expect(data.isCheckInButtonDisplayed).toStrictEqual(false);
    });
});
