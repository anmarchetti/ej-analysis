import validationService from 'frontend/services/validation.service';

import { GuestBookingInfo, GuestBookingInfoFields } from './GuestBookingInfo';

let guestDetails: GuestBookingInfo;

describe('GuestBookingInfo', () => {
    beforeAll(() => {
        // @ts-ignore
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date(2023, 4, 22));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        guestDetails = new GuestBookingInfo('12345', new Date(2023, 4, 22, 23).toISOString(), 'Joseph Pisludski');
    });

    it('should be created with required params', () => {
        const departureDate = new Date(guestDetails.departureDate);
        expect(departureDate.getFullYear()).toBe(2023);
        expect(departureDate.getMonth()).toBe(4);
        expect(departureDate.getDate()).toBe(22);
        expect(guestDetails.bookingReference).toBe('12345');
        expect(guestDetails.lastName).toBe('Joseph Pisludski');
    });

    it('should create instance with cleared fields', () => {
        const emptyGuestDetails = new GuestBookingInfo();
        expect(emptyGuestDetails.bookingReference).toBe('');
        expect(emptyGuestDetails.departureDate).toBe('');
        expect(emptyGuestDetails.lastName).toBe('');
    });

    it('should change field with "onChangeField"', () => {
        guestDetails.onChangeField(GuestBookingInfoFields.BookingReference, '111');
        expect(guestDetails.bookingReference).toBe('111');
    });

    it('should clear data', () => {
        guestDetails.clearData();
        expect(guestDetails.bookingReference).toBe('');
        expect(guestDetails.departureDate).toBe('');
        expect(guestDetails.lastName).toBe('');
    });

    it('should isValid return true', () => {
        validationService.validateModel = jest.fn(() => []);
        expect(guestDetails.isValid).toBe(true);
    });

    it('should isValid return false', () => {
        validationService.validateModel = jest.fn(() => ['Some error'] as any);
        expect(guestDetails.isValid).toBe(false);
    });

    it('should return new Date() departureDateObject', () => {
        const departureObjectDate = new Date(guestDetails.departureDateObject);
        expect(departureObjectDate.getFullYear()).toBe(2023);
        expect(departureObjectDate.getMonth()).toBe(4);
        expect(departureObjectDate.getDate()).toBe(22);
    });

    it('should return departureDate within departureDateObject', () => {
        guestDetails.departureDate = '12/12/2022'; // For parseDateL10n correct value
        const departureObjectDate = new Date(guestDetails.departureDateObject);
        expect(departureObjectDate.getFullYear()).toBe(2022);
        expect(departureObjectDate.getMonth()).toBe(11);
        expect(departureObjectDate.getDate()).toBe(12);
    });
});
