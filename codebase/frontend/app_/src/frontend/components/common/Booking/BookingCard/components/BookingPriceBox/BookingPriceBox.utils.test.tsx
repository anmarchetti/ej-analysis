import { CurrencyCode } from 'code/currency';
import { mockBooking } from 'frontend/__mocks__/booking';
import * as utils from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';

import { usePreparedBookingPriceBoxData } from './BookingPriceBox.utils';

let mockIsFlightDeparted = false;
jest.mock('frontend/utils/viewBooking.utils', () => ({
    __esModule: true,
    isFlightDeparted: jest.fn(() => mockIsFlightDeparted),
}));

describe('usePreparedBookingOptionsData', () => {
    it('should return correct data from offer hotel', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: { depDate: 'depDate' },
            isCanceled: true,
        } as any);
        const data = usePreparedBookingPriceBoxData(mockBooking, false);

        expect(data).toStrictEqual({
            isNullable: true,
            isCancelWarningDisplayed: false,
            pills: {
                currency: CurrencyCode.GBP,
                departureDate: 'depDate',
                dueDate: mockBooking.paymentInfo.balanceDueDate,
                isExternalAgency: undefined,
                remainingBalance: 1,
            },
        });
    });

    it('should return isNullable as false when isUpcoming is true', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: { depDate: 'depDate' },
            isCanceled: true,
        } as any);
        const data = usePreparedBookingPriceBoxData(mockBooking, true);

        expect(data.isNullable).toBe(false);
    });

    it('should return isNullable as false when isCancelled is false', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: { depDate: 'depDate' },
            isCanceled: false,
        } as any);
        const data = usePreparedBookingPriceBoxData(mockBooking, false);

        expect(data.isNullable).toBe(false);
    });

    it('should return departureDate as null when depDate is NOT provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: {},
            isCanceled: false,
        } as any);
        const data = usePreparedBookingPriceBoxData(mockBooking, false);

        expect(data.pills.departureDate).toBe(null);
    });

    it('should return isCancelWarningDisplayed as false when isUpcoming is false', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: {},
            isCanceled: false,
        } as any);
        const booking = { ...mockBooking, isDestinationRulesApplied: true };
        const data = usePreparedBookingPriceBoxData(booking, false);

        expect(data.isCancelWarningDisplayed).toBe(false);
    });

    it('should return isCancelWarningDisplayed as true when isDestinationRulesApplied is true and isUpcoming is true', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: {},
            isCanceled: false,
        } as any);
        const booking = { ...mockBooking, isDestinationRulesApplied: true };
        const data = usePreparedBookingPriceBoxData(booking, true);

        expect(data.isCancelWarningDisplayed).toBe(true);
    });

    it('should return isCancelWarningDisplayed as false when isDestinationRulesApplied is true and isUpcoming is true and flight has departed', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            routeDep: {},
            isCanceled: false,
        } as any);
        const booking = { ...mockBooking, isDestinationRulesApplied: true };
        mockIsFlightDeparted = true;
        const data = usePreparedBookingPriceBoxData(booking, true);
        expect(data.isCancelWarningDisplayed).toBe(false);
    });
});
