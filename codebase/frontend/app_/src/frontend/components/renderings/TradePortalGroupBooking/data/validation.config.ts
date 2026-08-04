import { EMAIL_MAX_LENGTH, EMAIL_PATTERN, IValidationConfig } from 'code/validation.config';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';

import { GroupBookingFormFields } from './GroupBooking';

export interface IGroupBookingErrorMessages {
    [GroupBookingFormFields.AgentName]: {
        required: string;
    };
    [GroupBookingFormFields.AgentEmail]: {
        required: string;
    };
    [GroupBookingFormFields.AgentNumber]: {
        required: string;
    };
    [GroupBookingFormFields.DepartureDate]: {
        date: string;
        required: string;
        tomorrowDate: string;
    };
    [GroupBookingFormFields.Duration]: {
        maxValue: string;
        minValue: string;
        required: string;
    };
    [GroupBookingFormFields.Destination]: {
        required: string;
    };
    [GroupBookingFormFields.DepartureAirport]: {
        required: string;
    };
    [GroupBookingFormFields.Boards]: {
        required: string;
    };
    general: {
        invalid: string;
        maxLength: string;
    };
}

/** dynamically create validation config, so we can use values from datasource */
export const generateGroupBookingValidationConfig = (errorMessages: IGroupBookingErrorMessages): IValidationConfig => ({
    [GroupBookingFormFields.AgentName]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.agentName.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            rawMessage: errorMessages.general.invalid,
            value: /^[a-zA-Z0-9\s,-.]*$/i,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            rawMessage: errorMessages.general.maxLength,
            value: 32,
            trigger: ValidationType.OnType,
        },
    ],
    [GroupBookingFormFields.AgentEmail]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.agentEmail.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            rawMessage: errorMessages.general.invalid,
            value: EMAIL_PATTERN,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            rawMessage: errorMessages.general.maxLength,
            value: EMAIL_MAX_LENGTH,
            trigger: ValidationType.OnType,
        },
    ],
    [GroupBookingFormFields.AgentNumber]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.agentNumber.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            rawMessage: errorMessages.general.invalid,
            value: /^[0-9\/]*$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            rawMessage: errorMessages.general.maxLength,
            value: 15,
            trigger: ValidationType.OnType,
        },
    ],
    [GroupBookingFormFields.DepartureDate]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.departureDate.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Date,
            rawMessage: errorMessages.departureDate.date,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.TomorrowDate,
            rawMessage: errorMessages.departureDate.tomorrowDate,
            trigger: ValidationType.OnBlur,
        },
    ],
    [GroupBookingFormFields.Duration]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.duration.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxValue,
            rawMessage: errorMessages.duration.maxValue,
            trigger: ValidationType.OnType,
            value: 28,
        },
        {
            type: ValidationRule.MinValue,
            rawMessage: errorMessages.duration.minValue,
            trigger: ValidationType.OnType,
            value: 0,
        },
    ],
    [GroupBookingFormFields.Destination]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.destination.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            rawMessage: errorMessages.destination.required,
            value: /^[a-zA-Z\s,]*$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            rawMessage: errorMessages.destination.required,
            value: 32,
            trigger: ValidationType.OnBlur,
        },
    ],
    [GroupBookingFormFields.AdditionalDetails]: [
        {
            type: ValidationRule.Pattern,
            rawMessage: errorMessages.general.invalid,
            value: /^[a-zA-Z0-9\s-,.]*$/i,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            rawMessage: errorMessages.general.maxLength,
            value: 200,
            trigger: ValidationType.OnType,
        },
    ],
    [GroupBookingFormFields.DepartureAirport]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.departureAirport.required,
            trigger: ValidationType.OnBlur,
        },
    ],
    [GroupBookingFormFields.Boards]: [
        {
            type: ValidationRule.Required,
            rawMessage: errorMessages.boards.required,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MinLength,
            rawMessage: errorMessages.boards.required,
            value: 1,
            trigger: ValidationType.OnBlur,
        },
    ],
});
