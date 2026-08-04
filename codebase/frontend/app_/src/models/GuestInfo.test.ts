import { mockGuests, mockRoom } from 'frontend/__mocks__';
import validationService from 'frontend/services/validation.service';

import { GuestType } from './enum/GuestType';
import SitecoreDictionary from './enum/SitecoreDictionary';
import { ValidationType } from './enum/ValidationType';
import { GuestInfo, IGuestInfoFields } from './GuestInfo';

const isTradePortal = false;

describe('GuestInfo', () => {
    const resetMocks = () =>
        ({
            type: GuestType.Adult,
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'admin@test.com',
            age: 18,
            address: 'Test 044',
            city: 'Test',
            dateOfBirth: '22/22/2222',
            postCode: 'B33 8TH',
            notBornYet: false,
        } as IGuestInfoFields);

    validationService.validateModel = jest.fn().mockReturnValue([]);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('getGuestsAllocation', () => {
        it('should return guest allocation object', () => {
            const result = GuestInfo.getGuestsAllocation(mockGuests, mockRoom);

            expect(result).toStrictEqual({
                adults: [mockGuests[0], mockGuests[1]],
                children: [],
                infants: [mockGuests[2]],
                roomCode: 'roomType_code',
            });
        });
    });

    describe('isValid', () => {
        it('it should call validateModel correct for lead', () => {
            const info = new GuestInfo(mocks, true);
            Object.defineProperty(info, 'dateOfBirthErrors', {
                get: jest.fn().mockReturnValue([]),
            });
            const res = info.isValidBySiteName(isTradePortal);

            expect(res).toBeTruthy();
            expect(validationService.validateModel).toBeCalledWith(info, ['dateOfBirth']);
        });

        it('it should call validateModel correct for infant', () => {
            const info = new GuestInfo({
                type: GuestType.Infant,
                firstName: 'firstName',
                lastName: 'lastName',
                age: 1,
                notBornYet: false,
            });
            Object.defineProperty(info, 'dateOfBirthErrors', {
                get: jest.fn().mockReturnValue([]),
            });
            const res = info.isValidBySiteName(isTradePortal);

            expect(res).toBeTruthy();
            expect(validationService.validateModel).toBeCalledWith(info, [
                'email',
                'phone',
                'title',
                'address',
                'address2',
                'city',
                'postCode',
                'dateOfBirth',
                'dialingCode',
                'countryCode',
            ]);
        });

        it('it should call validateModel correct for child', () => {
            const info = new GuestInfo({
                type: GuestType.Child,
                firstName: 'firstName',
                lastName: 'lastName',
                age: 15,
                notBornYet: false,
            });
            Object.defineProperty(info, 'dateOfBirthErrors', {
                get: jest.fn().mockReturnValue([]),
            });
            const res = info.isValidBySiteName(isTradePortal);

            expect(res).toBeTruthy();
            expect(validationService.validateModel).toBeCalledWith(info, [
                'email',
                'phone',
                'address',
                'address2',
                'city',
                'postCode',
                'dialingCode',
                'countryCode',
            ]);
        });

        it('it should call validateModel correct for adult', () => {
            const info = new GuestInfo(mocks);
            Object.defineProperty(info, 'dateOfBirthErrors', {
                get: jest.fn().mockReturnValue([]),
            });
            const res = info.isValidBySiteName(isTradePortal);

            expect(res).toBeTruthy();
            expect(validationService.validateModel).toBeCalledWith(info, [
                'email',
                'phone',
                'address',
                'address2',
                'city',
                'postCode',
                'dateOfBirth',
                'dialingCode',
                'countryCode',
            ]);
        });
    });

    describe('dateOfBirthErrors', () => {
        it('should return empty array when DOB is valid', () => {
            const info = new GuestInfo(mocks, true);
            info.dateOfBirth = '10/10/2000';
            validationService.validateField = jest.fn().mockReturnValue([]);
            info.holidayStartDate = new Date();
            const res = info.dateOfBirthErrors;

            expect(res).toEqual([]);
        });

        it('should return valid error', () => {
            const error = [
                {
                    errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesDOBInvalid,
                    trigger: ValidationType.OnBlur,
                    propertyName: 'dateOfBirth',
                },
            ];
            const info = new GuestInfo(mocks);
            validationService.validateField = jest.fn().mockReturnValue(error);
            info.holidayStartDate = new Date();
            const res = info.dateOfBirthErrors;

            expect(res).toEqual(error);
        });

        describe('dateOfBirthErrors of child', () => {
            it('should return empty array when DOB of child is valid', () => {
                mocks.type = GuestType.Child;

                validationService.validateField = jest.fn().mockReturnValue([]);

                const info = new GuestInfo(mocks);

                info.dateOfBirth = '10/10/2009';
                info.age = 10;
                info.holidayStartDate = new Date('2020-01-01T12:00:00.000Z');

                const res = info.dateOfBirthErrors;

                expect(res).toEqual([]);
            });

            it('should return errors when DOB of child is not valid', () => {
                const error = [
                    {
                        errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesChildAgeError,
                        trigger: ValidationType.OnBlur,
                        propertyName: 'dateOfBirth',
                    },
                ];
                mocks.type = GuestType.Child;
                mocks.age = 10;

                validationService.validateField = jest.fn().mockReturnValue([]);

                const info = new GuestInfo(mocks);

                info.dateOfBirth = '10/10/2019';
                info.holidayStartDate = new Date('2020-01-01T12:00:00.000Z');

                const res = info.dateOfBirthErrors;

                expect(res).toEqual(error);
            });

            it('should return updated error when DOB of child is NOT provided', () => {
                mocks.type = GuestType.Child;

                const error = [
                    {
                        errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesDOBInvalid,
                        trigger: ValidationType.OnBlur,
                        propertyName: 'dateOfBirth',
                        rule: 'required',
                    },
                    {
                        errorMessage: 'test',
                        trigger: ValidationType.OnBlur,
                        propertyName: 'test',
                        rule: 'date',
                    },
                ];

                validationService.validateField = jest.fn().mockReturnValue(error);

                const info = new GuestInfo(mocks);

                const res = info.dateOfBirthErrors;

                expect(res).toEqual([
                    { ...error[0], errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesChildAgeRequired },
                    error[1],
                ]);
            });
        });
    });

    describe('onChangeField', () => {
        it('it should update field value', () => {
            const info = new GuestInfo(mocks, true);
            info.onChangeField('firstName', 'NewFirstName');

            expect(info.firstName).toEqual('NewFirstName');
        });
    });

    describe('toggleSurnameSameAsLead', () => {
        it('should update lastName when it is checked', () => {
            const info = new GuestInfo(mocks, true);

            const surname = 'Doe';
            info.toggleSurnameSameAsLead(true, surname);

            expect(info.useSurnameAsLead).toBe(true);
            expect(info.lastName).toBe(surname);
        });

        it('should remove lastName when it is unchecked', () => {
            const info = new GuestInfo(mocks, true);

            const surname = 'Doe';
            info.lastName = surname;

            info.toggleSurnameSameAsLead(false, surname);

            expect(info.useSurnameAsLead).toBe(false);
            expect(info.lastName).toBe('');
        });
    });

    describe('dateOfBirthObject', () => {
        it('should return dateOfBirth', () => {
            const info = new GuestInfo(mocks, true);

            info.dateOfBirth = '10/10/2000';

            expect(info.dateOfBirthObject!.toISOString()).toBe('2000-10-10T00:00:00.000Z');
        });

        it('should return null when dateOfBirth is undefined', () => {
            const info = new GuestInfo(mocks, true);

            info.dateOfBirth = undefined;

            expect(info.dateOfBirthObject).toBe(null);
        });
    });
});
