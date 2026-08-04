import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { GuestErrorPlace } from './RoomAllocationGroup';
import { getAdultsError, getAdultsErrorTrackValidationField } from './RoomAllocationGroup.utils';

describe('RoomAllocationGroup.utils', () => {
    describe('getAdultsError', () => {
        it('should return isAdultsErrorMinimumNumberOfAdults when isAdultsErrorMinimumNumberOfAdults', () => {
            expect(getAdultsError(true, false)).toBe(
                SitecoreDictionary.RoomAllocationErrorsMinimumNumberOfAdultGuestsPerRoom,
            );
        });

        it('should return RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest when isAdultsErrorMaximumInfantsPerAdult', () => {
            expect(getAdultsError(false, true)).toBe(
                SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest,
            );
        });

        it('should return empty string by default', () => {
            expect(getAdultsError(false, false)).toBe('');
        });
    });

    describe('getAdultsErrorTrackValidationField', () => {
        it('should return Adults value when isSearchBar is false', () => {
            expect(getAdultsErrorTrackValidationField(true, false, false)).toBe(GuestErrorPlace.Adults);
        });

        it('should return FewAdultsWhoFieldError value when isAdultsErrorMinimumNumberOfAdults', () => {
            expect(getAdultsErrorTrackValidationField(true, false, true)).toBe(SearchPodValidationFields.AdultPerRoom);
        });

        it('should return MaxInfantsPerAdultWhoFieldError when isAdultsErrorMaximumInfantsPerAdult', () => {
            expect(getAdultsErrorTrackValidationField(false, true, true)).toBe(
                SearchPodValidationFields.MaxInfantsPerAdult,
            );
        });

        it('should return empty string by default', () => {
            expect(getAdultsErrorTrackValidationField(false, false, true)).toBe('');
        });
    });
});
