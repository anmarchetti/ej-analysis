import { mockBooking } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';

import { getHotelMeta } from './ViewBookingHotel.utils';

let booking: IBookingInfo;

describe('ViewBookingHotel.utils', () => {
    beforeEach(() => {
        booking = deepClone(mockBooking);
    });

    describe('getHotelMeta', () => {
        it('Return booking meta object', () => {
            const result = getHotelMeta(booking);

            expect(result).toEqual(
                expect.objectContaining({
                    hotelName: 'Hard Rock Hotel Tenerife',
                    starRating: 5,
                    taRating: 4.5,
                    numberOfReviews: 6769,
                    accom: mockBooking.package.accom,
                }),
            );
        });

        it('Return accom field as null', () => {
            booking.package = null as any;
            const result = getHotelMeta(booking);

            expect(result.accom).toBeNull();
        });

        it('Return star rating field as null', () => {
            booking.package.accom.hotel.starRating = null as any;
            const result = getHotelMeta(booking);

            expect(result.starRating).toBeNull();
        });
    });
});
