import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';

import { buildTrackingValue, isWhenFieldPrePopulated } from './searchPod.utils';

jest.mock('frontend/utils/date.utils');
jest.mock('frontend/utils/destinations.utils');
jest.mock('frontend/utils/search/search.utils');
jest.mock('frontend/utils/tracking/tracking.utils');
jest.mock('models/RoomAllocation.utils');
jest.mock('frontend/utils/tracking/searchPodFromField.utils');

describe('searchPod.utils', () => {
    describe('buildTrackingValue', () => {
        it('should add placeholder when field is pre-populated', () => {
            const result = buildTrackingValue(true, 'Full Value', '- PP');
            expect(result).toBe('Full Value - PP');
        });

        it('should not add placeholder when field is not pre-populated', () => {
            const result = buildTrackingValue(false, 'Full Value', '- PP');
            expect(result).toBe('Full Value');
        });

        it('should handle empty placeholder', () => {
            const result = buildTrackingValue(true, 'Full Value', '');
            expect(result).toBe('Full Value ');
        });

        it('should handle empty value with pre-population', () => {
            const result = buildTrackingValue(true, '', '- PP');
            expect(result).toBe(' - PP');
        });
    });

    describe('isWhenFieldPrePopulated', () => {
        it('should return false when prefilledSearch is null', () => {
            const result = isWhenFieldPrePopulated(null, new Date(), 7, 0, false);
            expect(result).toBe(false);
        });

        it('should return false when fromDate is null', () => {
            const prefilledSearch = {
                startDate: '01-01-2025',
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, null, 7, 0, false);
            expect(result).toBe(false);
        });

        it('should return true when all when fields match', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: 3,
                isMonthSearch: false,
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-01'), 7, 3, false);

            expect(formatDateL10n).toHaveBeenCalledWith(new Date('2025-01-01'), DATE_FORMATS.default);
            expect(result).toBe(true);
        });

        it('should return false when start date does not match', () => {
            jest.mocked(formatDateL10n).mockReturnValue('02-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: 3,
                isMonthSearch: false,
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-02'), 7, 3, false);
            expect(result).toBe(false);
        });

        it('should return false when duration does not match', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: 3,
                isMonthSearch: false,
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-01'), 14, 3, false);
            expect(result).toBe(false);
        });

        it('should return false when flexDays does not match', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: 3,
                isMonthSearch: false,
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-01'), 7, 0, false);
            expect(result).toBe(false);
        });

        it('should return false when isMonthSearch does not match', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: 3,
                isMonthSearch: true,
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-01'), 7, 3, false);
            expect(result).toBe(false);
        });

        it('should return false when flexDays is undefined', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: 0,
                isMonthSearch: false,
            } as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-01'), 7, undefined, false);
            expect(result).toBe(false);
        });

        it('should return false when prefilled flex days in undefined', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch: Partial<IPrefilledSearchParams> = {
                startDate: '01-01-2025',
                durations: ['7'],
                flexDays: undefined,
                isMonthSearch: false,
            };

            const result = isWhenFieldPrePopulated(
                prefilledSearch as IPrefilledSearchParams,
                new Date('2025-01-01'),
                7,
                0,
                false,
            );
            expect(result).toBe(false);
        });

        it('should handle missing durations array', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch: Partial<IPrefilledSearchParams> = {
                startDate: '01-01-2025',
                durations: undefined,
                flexDays: 0,
                isMonthSearch: false,
            };

            const result = isWhenFieldPrePopulated(
                prefilledSearch as IPrefilledSearchParams,
                new Date('2025-01-01'),
                0,
                0,
                false,
            );
            expect(result).toBe(false);
        });

        it('should handle empty durations array', () => {
            jest.mocked(formatDateL10n).mockReturnValue('01-01-2025');

            const prefilledSearch = {
                startDate: '01-01-2025',
                durations: [],
                flexDays: 0,
                isMonthSearch: false,
            } as unknown as IPrefilledSearchParams;

            const result = isWhenFieldPrePopulated(prefilledSearch, new Date('2025-01-01'), 0, 0, false);
            expect(result).toBe(false);
        });
    });
});
