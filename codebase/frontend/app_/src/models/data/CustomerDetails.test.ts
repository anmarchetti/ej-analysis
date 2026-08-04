import validationService from 'frontend/services/validation.service';
import { OfferSectionTypes } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';

import { CustomerDetails } from './CustomerDetails';

describe('CustomerDetails', () => {
    let customer;

    beforeEach(() => {
        customer = new CustomerDetails();
    });

    describe('Form Data', () => {
        beforeEach(() => {
            customer.email = 'email@test.com';
            customer.password = 'password';
            customer.firstName = 'firstName';
            customer.lastName = 'lastName';
            customer.title = 'Ms';
            customer.address1 = 'address1';
            customer.address2 = 'address2';
            customer.city = 'city';
            customer.postalCode = 'AA11BB';
            customer.countryCode = 'GB';
            customer.dialingCode = '44';
            customer.mobilePhone = '1244';
            customer.airport1 = 'AAA';
            customer.airport2 = 'BBB';
            customer.airport3 = 'CCC';
        });

        it('should get data as ILoginInfo', () => {
            expect(customer.formData).toEqual({
                email: 'email@test.com',
                firstName: 'firstName',
                lastName: 'lastName',
                title: 'Ms',
                mobilePhone: '1244',
                birthDate: '',
                dialingCode: '44',
                countryCode: 'GB',
                address1: 'address1',
                address2: 'address2',
                city: 'city',
                postalCode: 'AA11BB',
                mailingsFlag: false,
                easyJetMailingsFlag: false,
                preferredAirports: ['AAA', 'BBB', 'CCC'],
            });
        });

        it('should reset all fields', () => {
            customer.resetFields();

            expect(customer.email).toBe('');
            expect(customer.password).toBe('');
            expect(customer.title).toBe('');
            expect(customer.firstName).toBe('');
            expect(customer.lastName).toBe('');
            expect(customer.address1).toBe('');
            expect(customer.address2).toBe('');
            expect(customer.city).toBe('');
            expect(customer.postalCode).toBe('');
            expect(customer.dialingCode).toBe('');
            expect(customer.mobilePhone).toBe('');
            expect(customer.countryCode).toBe('');
            expect(customer.airport1).toBe('');
            expect(customer.airport2).toBe('');
            expect(customer.airport3).toBe('');
            expect(customer.mailingsFlag).toBeNull();
            expect(customer.easyJetMailingsFlag).toBeNull();
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            validationService.validateModel = jest.fn().mockReturnValue([]);
        });

        it("should be valid if validateModel doesn't return errors and mailings flags are valid", () => {
            customer.mailingsFlag = true;
            customer.easyJetMailingsFlag = true;

            expect(customer.isValid).toBeTruthy();
        });

        it('should be NOT valid if validateModel returns errors', () => {
            validationService.validateModel = jest.fn().mockReturnValueOnce(['error']);

            expect(customer.isValid).toBeFalsy();
        });

        it('should be NOT valid if mailingsFlag is null', () => {
            customer.mailingsFlag = null;

            expect(customer.isValid).toBeFalsy();
        });

        it('should be NOT valid if easyJetMailingsFlag is null', () => {
            customer.mailingsFlag = true;
            customer.easyJetMailingsFlag = null;

            expect(customer.isValid).toBeFalsy();
        });
    });

    describe('Field Validation', () => {
        it("should be valid field if validation service doesn't return errors", () => {
            validationService.validateField = jest.fn().mockReturnValueOnce([]);

            expect(customer.isFieldValid('email')).toBeTruthy();
        });

        it('should be NOT valid field if validation service returns errors', () => {
            validationService.validateField = jest.fn().mockReturnValueOnce(['error']);

            expect(customer.isFieldValid('email')).toBeFalsy();
        });
    });

    describe('Field Change', () => {
        describe.each([
            ['title', 'Ms'],
            ['firstName', 'test'],
            ['lastName', 'test'],
            ['address1', 'address'],
            ['address2', 'address'],
            ['city', 'city'],
            ['postalCode', 'AA11BB'],
            ['countryCode', 'GB'],
            ['dialingCode', '44'],
            ['mobilePhone', '1244'],
            ['airport1', 'AAA'],
            ['airport2', 'BBB'],
            ['airport3', 'CCC'],
        ])('onChangeField()', (field, expected) => {
            it(`should update ${field} to ${expected}`, () => {
                customer.onChangeField(field as any, expected);

                expect(customer[field]).toEqual(expected);
            });
        });

        describe('onChangeMailingsFlag()', () => {
            it('should set both flags to FALSE, if isOffersOptedIn unchecked', () => {
                customer.onChangeMailingsFlag(OfferSectionTypes.IsOffersOptedIn, false);

                expect(customer.mailingsFlag).toBeFalsy();
                expect(customer.easyJetMailingsFlag).toBeFalsy();
            });

            it('should set mailingsFlag to TRUE and easyJetMailingsFlag to NULL, if isOffersOptedIn checked', () => {
                customer.onChangeMailingsFlag(OfferSectionTypes.IsOffersOptedIn, true);

                expect(customer.mailingsFlag).toBeTruthy();
                expect(customer.easyJetMailingsFlag).toBeNull();
            });

            it('should set only easyJetMailingsFlag, if isPartnerOffersOptedIn toggled', () => {
                const initialMailingsFlag = customer.mailingsFlag;

                customer.onChangeMailingsFlag(OfferSectionTypes.IsPartnerOffersOptedIn, true);

                expect(customer.mailingsFlag).toBe(initialMailingsFlag);
                expect(customer.easyJetMailingsFlag).toBeTruthy();
            });
        });
    });
});
