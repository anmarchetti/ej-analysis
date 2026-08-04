import { createLocalStore } from 'frontend/utils/createLocalStore';
import { GroupBookingFormFields } from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';
import { IGroupBookingErrorMessages } from 'frontend/components/renderings/TradePortalGroupBooking/data/validation.config';
import { TTradePortalGroupBookingProps } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

import { GroupBookingStore } from './GroupBookingStore';

// create local store for TradePortalGroupBooking component and it's children
export const [withGroupBookingStore, useGroupBookingStore] = createLocalStore<
    GroupBookingStore,
    TTradePortalGroupBookingProps
>((_, { fields }) => {
    const {
        AgentNameRequiredError,
        AgentEmailRequiredError,
        ABTAorAgentNumRequiredError,
        GeneralInvalidError,
        GeneralLimitError,
        DepartureDateError,
        DurationOfHolidayError,
        DestinationError,
        DepartureAirportError,
        BoardsError,
    } = fields || {};

    // extract error messages from datasource fields
    const formErrorMessages: IGroupBookingErrorMessages = {
        [GroupBookingFormFields.AgentName]: {
            required: AgentNameRequiredError?.value ?? '',
        },
        [GroupBookingFormFields.AgentEmail]: {
            required: AgentEmailRequiredError?.value ?? '',
        },
        [GroupBookingFormFields.AgentNumber]: {
            required: ABTAorAgentNumRequiredError?.value ?? '',
        },
        [GroupBookingFormFields.DepartureDate]: {
            required: DepartureDateError?.value ?? '',
            date: DepartureDateError?.value ?? '',
            tomorrowDate: DepartureDateError?.value ?? '',
        },
        [GroupBookingFormFields.Duration]: {
            required: DurationOfHolidayError?.value ?? '',
            maxValue: DurationOfHolidayError?.value ?? '',
            minValue: DurationOfHolidayError?.value ?? '',
        },
        [GroupBookingFormFields.Destination]: {
            required: DestinationError?.value ?? '',
        },
        [GroupBookingFormFields.DepartureAirport]: {
            required: DepartureAirportError?.value ?? '',
        },
        [GroupBookingFormFields.Boards]: {
            required: BoardsError?.value ?? '',
        },
        general: {
            invalid: GeneralInvalidError?.value ?? '',
            maxLength: GeneralLimitError?.value ?? '',
        },
    };

    return new GroupBookingStore(formErrorMessages);
});
