import { BookingStatus } from 'models/enum/BookingStatus';

import { getCommonData, usePreparedBookingData } from './BookingCard.utils';

const mockBooking = {
    package: {
        accom: { hotel: { images: ['image1', 'image2'] } },
        transport: { routes: [{ name: 'route1' }, { name: 'route2' }] },
    },
    bookingStatus: BookingStatus.Canceled,
} as any;

describe('BookingCard.utils', () => {
    describe('getCommonData', () => {
        it('should return data from booking', () => {
            const data = getCommonData(mockBooking);

            expect(data).toStrictEqual({
                offer: { hotel: { images: ['image1', 'image2'] } },
                isCanceled: true,
                routeDep: { name: 'route1' },
            });
        });

        it('should return data with isCanceled as false when booking status is NOT cancelled', () => {
            mockBooking.bookingStatus = '';
            const data = getCommonData(mockBooking);

            expect(data).toStrictEqual({
                offer: { hotel: { images: ['image1', 'image2'] } },
                isCanceled: false,
                routeDep: { name: 'route1' },
            });
        });
    });

    describe('usePreparedBookingData', () => {
        it('should return images from booking data', () => {
            const data = usePreparedBookingData(mockBooking);

            expect(data).toStrictEqual({ images: ['image1', 'image2'] });
        });

        it('should return empty images when images NOT provided', () => {
            mockBooking.package.accom.hotel = null;
            const data = usePreparedBookingData(mockBooking);

            expect(data).toStrictEqual({ images: undefined });
        });
    });
});
