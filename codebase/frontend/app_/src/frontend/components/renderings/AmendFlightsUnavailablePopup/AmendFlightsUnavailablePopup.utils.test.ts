import { mockAmendDatesOffer, mockBooking } from 'frontend/__mocks__';
import { RouteDirection } from 'models/enum/RouteDirection';

import { getBookingData } from './AmendFlightsUnavailablePopup.utils';

const mockedGetRoute = jest.fn().mockImplementation(() => ({
    arrName: 'Sharlott',
    depName: 'London',
}));
jest.mock('frontend/utils/route.utils', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/utils/route.utils'),
    getRoute: (...params) => mockedGetRoute(...params),
}));

const mockedGetBookingRoute = jest.fn().mockImplementation(() => ({
    arrName: 'Lanzarote',
    depName: 'London Gatwick',
}));
jest.mock('frontend/utils/viewBooking.utils', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/utils/viewBooking.utils'),
    getBookingRoute: (...params) => mockedGetBookingRoute(...params),
}));

describe('AmendFlightsUnavailablePopup.utils', () => {
    describe('getBookingData', () => {
        it('should be called with isFromChangeDate', () => {
            const result = getBookingData(mockAmendDatesOffer, mockBooking, true);

            expect(mockedGetRoute).toHaveBeenCalledWith(mockAmendDatesOffer, RouteDirection.Outbound);
            expect(result).toStrictEqual({
                arrAirportName: 'Sharlott',
                bookingStartDate: '2023-03-15',
                depAirportName: 'London',
            });
        });

        it('should be called without isFromChangeDate', () => {
            const result = getBookingData(mockAmendDatesOffer, mockBooking);

            expect(mockedGetBookingRoute).toHaveBeenCalledWith(mockBooking, RouteDirection.Outbound);
            expect(result).toStrictEqual({
                arrAirportName: 'Lanzarote',
                bookingStartDate: '2029-06-19',
                depAirportName: 'London Gatwick',
            });
        });

        it('should be called without isFromChangeDate and amendDatesOffer as null', () => {
            const result = getBookingData(null, mockBooking, true);

            expect(mockedGetBookingRoute).toHaveBeenCalledWith(mockBooking, RouteDirection.Outbound);
            expect(result).toStrictEqual({
                arrAirportName: 'Lanzarote',
                bookingStartDate: '2029-06-19',
                depAirportName: 'London Gatwick',
            });
        });

        it('should return airports as undefined for amend dates when getRoute returns undefined', () => {
            mockedGetRoute.mockReturnValueOnce(undefined);

            const result = getBookingData(mockAmendDatesOffer, mockBooking, true);

            expect(result).toStrictEqual({
                arrAirportName: undefined,
                bookingStartDate: '2023-03-15',
                depAirportName: undefined,
            });
        });

        it('should return airports as undefined for booking flow when getBookingRoute returns undefined', () => {
            mockedGetBookingRoute.mockReturnValueOnce(undefined);

            const result = getBookingData(mockAmendDatesOffer, mockBooking);

            expect(result).toStrictEqual({
                arrAirportName: undefined,
                bookingStartDate: '2029-06-19',
                depAirportName: undefined,
            });
        });
    });
});
