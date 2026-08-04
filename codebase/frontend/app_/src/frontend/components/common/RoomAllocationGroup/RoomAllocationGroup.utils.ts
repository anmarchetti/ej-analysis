import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { GuestErrorPlace } from './RoomAllocationGroup';

export const getAdultsError = (
    isAdultsErrorMinimumNumberOfAdults: boolean,
    isAdultsErrorMaximumInfantsPerAdult: boolean,
): string => {
    switch (true) {
        case isAdultsErrorMinimumNumberOfAdults:
            return SitecoreDictionary.RoomAllocationErrorsMinimumNumberOfAdultGuestsPerRoom;

        case isAdultsErrorMaximumInfantsPerAdult:
            return SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest;

        default:
            return '';
    }
};

export const getAdultsErrorTrackValidationField = (
    isAdultsErrorMinimumNumberOfAdults: boolean,
    isAdultsErrorMaximumInfantsPerAdult: boolean,
    isSearchBar: boolean,
): string => {
    if (!isSearchBar) {
        return GuestErrorPlace.Adults;
    }

    if (isAdultsErrorMinimumNumberOfAdults) {
        return SearchPodValidationFields.AdultPerRoom;
    }

    if (isAdultsErrorMaximumInfantsPerAdult) {
        return SearchPodValidationFields.MaxInfantsPerAdult;
    }

    return '';
};
