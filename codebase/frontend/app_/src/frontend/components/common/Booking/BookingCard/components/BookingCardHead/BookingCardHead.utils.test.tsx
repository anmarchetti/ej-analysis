import { mockBooking } from 'frontend/__mocks__/booking';
import * as locationUtils from 'frontend/utils/getHotelLocation';
import * as utils from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';

import { usePreparedBookingHeadData } from './BookingCardHead.utils';

let booking;

describe('usePreparedBookingHeadData', () => {
    beforeEach(() => {
        booking = mockBooking;
    });

    it('should return correct hotel path', () => {
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.hotelPath).toStrictEqual('/united-states/united-states/resort-example/hotel-example');
    });

    it('should return booking hotel name', () => {
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.hotelName).toStrictEqual('Hotel Example');
    });

    it('should return offer hotel name', () => {
        booking.hotel.name = null;
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { name: 'name test' } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.hotelName).toStrictEqual('name test');
    });

    it('should return offer hotel type', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { type: 'type test' } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.hotelType).toStrictEqual('type test');
    });

    it('should return offer hotel theme', () => {
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.hotelType).toStrictEqual({
            code: 'BO',
            description: 'Great bases in great locations, selected by our experts',
            filledIcon: '/-/jssmedia/874a2b5169f7408ba7548a2a1ca312ca.ashx',
            icon: '/-/jssmedia/a1daa333a4e949bebbd74ffcc10d6497.ashx',
            itemName: 'Handpicked',
            name: 'Handpicked',
            typeAndThemeTitle: 'Handpicked Hotel',
        });
    });

    it('should return hotel location', () => {
        jest.spyOn(locationUtils, 'getHotelLocation').mockReturnValueOnce('location');
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.hotelLocation).toStrictEqual('location');
    });

    it('should return first number from offer hotel star rating', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { starRating: '4.21' } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.starRating).toBe(4);
    });

    it('should return null when star rating not provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { starRating: '' } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.starRating).toBe(null);
    });

    it('should return true for isTAInfoDisplayed when taRating and numberOfReviews provided', () => {
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.isTAInfoDisplayed).toBe(true);
    });

    it('should return false for isTAInfoDisplayed when taRating NOT provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { numberOfReviews: 4 } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.isTAInfoDisplayed).toBe(false);
    });

    it('should return false for isTAInfoDisplayed when numberOfReviews NOT provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { rating: 4 } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.isTAInfoDisplayed).toBe(false);
    });

    it('should return null for taRating when offer hotel rating is NOT provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: {} } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.isTAInfoDisplayed).toBe(false);
    });

    it('should return taRating when offer hotel rating is provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { rating: 4 } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.taRating).toBe(4);
    });

    it('should return numberOfReviews', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValueOnce({ offer: { hotel: { numberOfReviews: 4 } } } as any);
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.numberOfReviews).toBe(4);
    });

    it('should return true for isEcoCertifiedPillDisplayed', () => {
        const data = usePreparedBookingHeadData(booking, true);

        expect(data.isEcoCertifiedPillDisplayed).toBe(true);
    });

    it('should return false for isEcoCertifiedPillDisplayed when eco facility name is NOT provided', () => {
        booking.hotel.ecoFacility.name = null;
        const data = usePreparedBookingHeadData(booking, true);

        expect(data.isEcoCertifiedPillDisplayed).toBe(false);
    });

    it('should return false for isEcoCertifiedPillDisplayed when eco facility tooltip is NOT provided', () => {
        booking.hotel.ecoFacility.tooltip = null;
        booking.hotel.ecoFacility.name = 'name';
        const data = usePreparedBookingHeadData(booking, true);

        expect(data.isEcoCertifiedPillDisplayed).toBe(false);
    });

    it('should return false for isEcoCertifiedPillDisplayed when isEcoCertifiedEnabledOnBookingListPage is false', () => {
        booking.hotel.ecoFacility.tooltip = 'tooltip';
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.isEcoCertifiedPillDisplayed).toBe(false);
    });

    it('should return eco title', () => {
        booking.hotel.ecoFacility.name = 'name';
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.title).toBe('name');
    });

    it('should return eco tooltip', () => {
        booking.hotel.ecoFacility.tooltip = 'tooltip';
        const data = usePreparedBookingHeadData(booking, false);

        expect(data.tooltip).toBe('tooltip');
    });
});
