import { EMAIL_MAX_LENGTH } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { IValidationError } from 'models/data/validation/IValidationError';
import { mockErrorMessages } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/errorMessages.mocks';

import { MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING } from './constants';
import { GroupBooking, GroupBookingFormFields } from './GroupBooking';

let groupBooking: GroupBooking;

describe('GroupBooking', () => {
    beforeEach(() => {
        groupBooking = new GroupBooking(mockErrorMessages);
        groupBooking.agentName = 'agentName';
        groupBooking.agentEmail = 'email@test.com';
        groupBooking.agentNumber = '123';
        groupBooking.departureDate = '10/25/2024';
        groupBooking.duration = '1';
        groupBooking.destination = 'destination';
        groupBooking.departureAirport = 'departureAirport';
        groupBooking.boards = [];
    });

    describe('isValid', () => {
        it('should be true no errors and totalQuantity is more then min number', () => {
            jest.spyOn(validationService, 'validateModel').mockReturnValue([]);
            jest.spyOn(groupBooking, 'totalQuantity', 'get').mockReturnValue(MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING + 1);
            expect(groupBooking.isValid).toBeTruthy();
        });

        it('should be false when totalQuantity is less then min number', () => {
            jest.spyOn(validationService, 'validateModel').mockReturnValue([]);
            jest.spyOn(groupBooking, 'totalQuantity', 'get').mockReturnValue(MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING - 1);

            expect(groupBooking.isValid).toBeFalsy();
        });

        it('should be false when there are errors', () => {
            jest.spyOn(validationService, 'validateModel').mockReturnValue([{} as IValidationError]);
            jest.spyOn(groupBooking, 'totalQuantity', 'get').mockReturnValue(MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING + 1);

            expect(groupBooking.isValid).toBeFalsy();
        });
    });

    describe('validateField', () => {
        describe.each([
            [GroupBookingFormFields.AgentName, 'name'],
            [GroupBookingFormFields.AgentEmail, 'test@test.com'],
            [GroupBookingFormFields.AgentNumber, '124'],
        ])('No Errors', (field, value) => {
            test(`returns no errors for ${field}`, () => {
                groupBooking[field as string] = value;
                const errors = groupBooking.validateField(field);
                expect(errors).toEqual([]);
            });
        });

        describe.each([
            [GroupBookingFormFields.AgentName, '', 'AgentNameRequiredError'],
            [GroupBookingFormFields.AgentEmail, '', 'AgentEmailRequiredError'],
            [GroupBookingFormFields.AgentNumber, '', 'ABTAorAgentNumRequiredError'],
            [GroupBookingFormFields.DepartureDate, '', 'DepartureDateRequiredError'],
            [GroupBookingFormFields.Duration, '', 'DurationRequiredError'],
            [GroupBookingFormFields.Destination, '', 'DestRequiredError'],
            [GroupBookingFormFields.DepartureAirport, '', 'DepAirRequiredError'],
            [GroupBookingFormFields.Boards, [], 'BoardsRequiredError'],
        ])('Required errors', (field, value, errorMessage) => {
            test(`returns ${field} error`, () => {
                groupBooking[field as string] = value;
                const errors = groupBooking.validateField(field);
                expect(errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ propertyName: field, rawErrorMessage: errorMessage }),
                    ]),
                );
            });
        });

        describe.each([
            [GroupBookingFormFields.AgentName, 32],
            [GroupBookingFormFields.AgentEmail, EMAIL_MAX_LENGTH],
            [GroupBookingFormFields.AgentNumber, 15],
            [GroupBookingFormFields.AdditionalDetails, 200],
        ])('General Max Length Error', (field, limit) => {
            test(`returns ${field} error`, () => {
                groupBooking[field as string] = 'a'.repeat(limit + 1);
                const errors = groupBooking.validateField(field);
                expect(errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ propertyName: field, rawErrorMessage: 'GeneralMaxLengthError' }),
                    ]),
                );
            });
        });

        describe.each([
            [GroupBookingFormFields.AgentName, '***'],
            [GroupBookingFormFields.AgentEmail, 'email'],
            [GroupBookingFormFields.AgentNumber, 'test'],
            [GroupBookingFormFields.AdditionalDetails, '***'],
        ])('General Invalid Error', (field, value) => {
            test(`returns ${field} error`, () => {
                groupBooking[field as string] = value;
                const errors = groupBooking.validateField(field);
                expect(errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ propertyName: field, rawErrorMessage: 'GeneralInvalidError' }),
                    ]),
                );
            });
        });
    });

    describe.each([
        [GroupBookingFormFields.AgentName, true],
        [GroupBookingFormFields.AgentEmail, true],
        [GroupBookingFormFields.AgentNumber, true],
        [GroupBookingFormFields.DepartureDate, true],
        [GroupBookingFormFields.Duration, true],
        [GroupBookingFormFields.Destination, true],
        [GroupBookingFormFields.DepartureAirport, true],
        [GroupBookingFormFields.Boards, true],
        [GroupBookingFormFields.AdditionalDetails, false],
    ])('isFieldRequired', (field, expected) => {
        test(`returns ${expected} for ${field}`, () => {
            const isRequired = groupBooking.isFieldRequired(field);
            expect(isRequired).toBe(expected);
        });
    });

    describe.each([
        [GroupBookingFormFields.AgentName, 'agentName'],
        [GroupBookingFormFields.AgentEmail, 'email@test.com'],
        [GroupBookingFormFields.AgentNumber, '1234'],
    ])('onChangeField', (field, value) => {
        test(`update ${field} value`, () => {
            groupBooking.onChangeField(field, value);
            expect(groupBooking[field]).toBe(value);
        });
    });
});
