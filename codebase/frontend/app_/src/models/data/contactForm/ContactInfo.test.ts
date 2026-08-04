import { ContactQueryType } from 'frontend/components/renderings/ContactUs/data/constants';

import { ContactFormFields, ContactInfo } from './ContactInfo';

let mockClass: ContactInfo;

describe('ContactInfo', () => {
    beforeEach(() => {
        mockClass = new ContactInfo();
    });

    it('should apply new values within onChangeField method', () => {
        mockClass.onChangeField(ContactFormFields.BookingReference, 'booking_reference');

        expect(mockClass[ContactFormFields.BookingReference]).toBe('booking_reference');
    });

    it('should validate fields for Post Booking Query', () => {
        mockClass.initializeValidationRules(ContactQueryType.PostBooking);

        expect(mockClass.isValid).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.DepartureAndReturnDate)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.BookingReference)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.About)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.Question)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.LeadPassengerFirstName)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.LeadPassengerLastName)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.EmailAddress)).toBeFalsy();
    });

    it('should validate fields for Post Booking Query when isBookingNotRequired is true', () => {
        mockClass.initializeValidationRules(ContactQueryType.PostBooking, true);

        expect(mockClass.isValid).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.DepartureAndReturnDate)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.BookingReference)).toBeTruthy();
        expect(mockClass.isValidField(ContactFormFields.About)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.Question)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.LeadPassengerFirstName)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.LeadPassengerLastName)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.EmailAddress)).toBeFalsy();
    });

    it('should validate fields for Pre Booking Query', () => {
        mockClass.initializeValidationRules(ContactQueryType.PreBooking);

        expect(mockClass.isValid).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.DepartureAndReturnDate)).toBeTruthy();
        expect(mockClass.isValidField(ContactFormFields.BookingReference)).toBeTruthy();
        expect(mockClass.isValidField(ContactFormFields.About)).toBeTruthy();
        expect(mockClass.isValidField(ContactFormFields.Question)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.LeadPassengerFirstName)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.LeadPassengerLastName)).toBeFalsy();
        expect(mockClass.isValidField(ContactFormFields.EmailAddress)).toBeFalsy();
    });

    it('should validate fields when query type is not selected', () => {
        mockClass.initializeValidationRules(null);

        expect(mockClass.isValid).toBeTruthy();
    });
});
