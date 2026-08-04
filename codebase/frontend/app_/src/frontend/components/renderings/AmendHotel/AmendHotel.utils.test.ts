import { mockAmendHotelOffer, mockBooking } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IBookingInfo } from 'models/data/IBookingInfo';

import { getHotelChangeInfo, getHotelOffer } from './AmendHotel.utils';

let booking;
let amendOffer;

describe('amendHotel.utils', () => {
    describe('getHotelOffer', () => {
        beforeEach(() => {
            booking = deepClone(mockBooking);
            amendOffer = deepClone(mockAmendHotelOffer);
        });

        it('Should return correct offer', () => {
            const offer = getHotelOffer(amendOffer, booking);

            expect(offer?.id).toEqual(amendOffer.accom.id);
            expect(offer?.date).toEqual(booking.package.accom.startDate);
            expect(offer?.price).toEqual(amendOffer.amendmentChargesInfo.fullAmendmentCharges);
            expect(offer?.stay).toEqual(amendOffer.accom.stay);
            expect(offer?.transport).toEqual(booking.package.transport);
        });

        it('Should return correct offer when amendment charge is equal to 0', () => {
            amendOffer.amendmentChargesInfo.fullAmendmentCharges = 0;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer?.price).toEqual(amendOffer.amendmentChargesInfo.fullAmendmentCharges);
        });

        it('Should return correct properties from offer object during destructuring', () => {
            amendOffer.amendmentChargesInfo.fullAmendmentCharges = 0;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer?.accom).toStrictEqual(amendOffer.accom);
            expect(offer?.extraLuggageInfo.items[0]).toStrictEqual(amendOffer.extraLuggageInfo.items[0]);
            expect(offer?.transfers[0]).toStrictEqual(amendOffer.transfers[0]);
            expect(offer?.hotel).toStrictEqual(amendOffer.hotel);
        });

        it('should return null if booking is null', () => {
            const offer = getHotelOffer(amendOffer, {} as IBookingInfo);

            expect(offer).toBeNull();
        });

        it('should return null if amend offer is null', () => {
            const offer = getHotelOffer({} as IAmendHotelOffer, booking);

            expect(offer).toBeNull();
        });

        it('should return null if both booking and amend offer are null', () => {
            const offer = getHotelOffer({} as IAmendHotelOffer, {} as IBookingInfo);

            expect(offer).toBeNull();
        });

        it('should return null if amendmentChargesInfo is null', () => {
            amendOffer.amendmentChargesInfo = null;
            booking.package.transport = null;
            booking.package.accom.startDate = null;
            amendOffer.accom.id = null;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer).toBeNull();
        });

        it('should return null if amendmentChargesInfo is null', () => {
            amendOffer.amendmentChargesInfo = null;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer).toBeNull();
        });

        it('should return null if booking transport is null', () => {
            booking.package.transport = null;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer).toBeNull();
        });

        it('should return null if booking accom start date is null', () => {
            booking.package.accom.startDate = null;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer).toBeNull();
        });

        it('should return null if amend offer accom id is null', () => {
            amendOffer.accom.id = null;

            const offer = getHotelOffer(amendOffer, booking);

            expect(offer).toBeNull();
        });
    });

    describe('getHotelChangeInfo', () => {
        it('Should return the correct hotel change information for a booking', () => {
            const result = getHotelChangeInfo(mockBooking);

            expect(result).toEqual({
                boardType: mockBooking.package.accom.rooms[0].boardType,
                endDate: mockBooking.package.accom.endDate,
                hasSelectedNewHotel: false,
                hotel: mockBooking.hotel,
                location: mockBooking.package.location,
                roomType: mockBooking.package.accom.rooms[0].roomType,
                routes: mockBooking.package.transport.routes,
                startDate: mockBooking.package.accom.startDate,
                transfer: mockBooking.transfers[0],
            });
        });

        it('Should return the correct hotel change information for an amend offer', () => {
            const result = getHotelChangeInfo(mockBooking, mockAmendHotelOffer);

            expect(result).toEqual({
                boardType: mockAmendHotelOffer.accom.unit[0].boardType,
                endDate: mockBooking.package.accom.endDate,
                hasSelectedNewHotel: true,
                hotel: mockAmendHotelOffer.hotel,
                location: {
                    city: mockAmendHotelOffer.hotel.resort.name,
                    country: mockAmendHotelOffer.hotel.country.code,
                    region: mockAmendHotelOffer.hotel.location.name,
                },
                roomType: mockAmendHotelOffer.accom.unit[0].roomType,
                routes: mockBooking.package.transport.routes,
                startDate: mockBooking.package.accom.startDate,
                transfer: mockAmendHotelOffer.transfers[0],
            });
        });
    });
});
