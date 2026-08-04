import { mockUnitRoom } from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { getAccommodationGuestsCount, getDurationLabel } from './accommodation.utils';

describe('accommodation.utils', () => {
    const mockGetPhrase = jest.fn(v => v);

    describe('getDurationLabel', () => {
        it('Should return an empty string if no duration', () => {
            const result = getDurationLabel(mockGetPhrase);

            expect(result).toBe('');
        });

        it('Should return an string with plural form', () => {
            const result = getDurationLabel(mockGetPhrase, 2);

            expect(result).toBe(`2 ${SitecoreDictionary.GlobalsLabelsNightsPlural}`);
        });

        it('Should return an string with plural form', () => {
            const result = getDurationLabel(mockGetPhrase, 1);

            expect(result).toBe(`1 ${SitecoreDictionary.GlobalsLabelsNightSingular}`);
        });
    });

    describe('getAccommodationGuestsCount', () => {
        it('Should return count of people', () => {
            const result = getAccommodationGuestsCount([mockUnitRoom]);

            expect(result).toStrictEqual({ [GuestType.Adult]: 1, [GuestType.Child]: 2, [GuestType.Infant]: 1 });
        });

        it('Should return object with zeroes when no units has been provided', () => {
            const result = getAccommodationGuestsCount();

            expect(result).toStrictEqual({ [GuestType.Adult]: 0, [GuestType.Child]: 0, [GuestType.Infant]: 0 });
        });
    });
});
