import { GroupBookingFormFields } from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';
import { IGroupBookingErrorMessages } from 'frontend/components/renderings/TradePortalGroupBooking/data/validation.config';

export const mockErrorMessages = {
    [GroupBookingFormFields.AgentName]: {
        required: 'AgentNameRequiredError',
    },
    [GroupBookingFormFields.AgentEmail]: {
        required: 'AgentEmailRequiredError',
    },
    [GroupBookingFormFields.AgentNumber]: {
        required: 'ABTAorAgentNumRequiredError',
    },
    [GroupBookingFormFields.DepartureDate]: {
        required: 'DepartureDateRequiredError',
        date: 'DepartureDateDateError',
        tomorrowDate: 'DepartureDateTomorrowDateError',
    },
    [GroupBookingFormFields.Duration]: {
        required: 'DurationRequiredError',
        maxValue: 'DurationMaxValueError',
        minValue: 'DurationMinValueError',
    },
    [GroupBookingFormFields.Destination]: {
        required: 'DestRequiredError',
    },
    [GroupBookingFormFields.DepartureAirport]: {
        required: 'DepAirRequiredError',
    },
    [GroupBookingFormFields.Boards]: {
        required: 'BoardsRequiredError',
    },
    general: {
        invalid: 'GeneralInvalidError',
        maxLength: 'GeneralMaxLengthError',
    },
} as IGroupBookingErrorMessages;
