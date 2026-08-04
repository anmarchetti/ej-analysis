import { GuestType } from 'models/enum/GuestType';

import { createDataTid, getAccommodationMeta } from './HolidaySummary.utils';

describe('AmendDatesDetails.utils', () => {
    describe('getAccommodationMeta', () => {
        it('Return all guests with icons and titles in single form', () => {
            const result = getAccommodationMeta(
                {
                    [GuestType.Adult]: 1,
                    [GuestType.Child]: 1,
                    [GuestType.Infant]: 1,
                },
                str => str,
            );

            expect(result[0].Icon).toBeTruthy();
            expect(result[0].label).toBe('1 x Globals.labels.adult');
            expect(result[1].Icon).toBeTruthy();
            expect(result[1].label).toBe('1 x Globals.labels.child');
            expect(result[2].Icon).toBeTruthy();
            expect(result[2].label).toBe('1 x Globals.labels.infant');
        });

        it('Return all guests with Icons and titles in plural form', () => {
            const result = getAccommodationMeta(
                {
                    [GuestType.Adult]: 3,
                    [GuestType.Child]: 2,
                    [GuestType.Infant]: 2,
                },
                str => str,
            );

            expect(result[0].Icon).toBeTruthy();
            expect(result[0].label).toBe('3 x Globals.labels.adults');
            expect(result[1].Icon).toBeTruthy();
            expect(result[1].label).toBe('2 x Globals.labels.children');
            expect(result[2].Icon).toBeTruthy();
            expect(result[2].label).toBe('2 x Globals.labels.infants');
        });

        it('Return adult and child if infant count is 0', () => {
            const result = getAccommodationMeta(
                {
                    [GuestType.Adult]: 3,
                    [GuestType.Child]: 1,
                    [GuestType.Infant]: 0,
                },
                str => str,
            );

            expect(result.length).toBe(2);
            expect(result[0].Icon).toBeTruthy();
            expect(result[0].label).toBe('3 x Globals.labels.adults');
            expect(result[1].Icon).toBeTruthy();
            expect(result[1].label).toBe('1 x Globals.labels.child');
        });

        it('Return filtered guests by type', () => {
            const result = getAccommodationMeta(
                {
                    test: 3,
                    [GuestType.Child]: 1,
                    [GuestType.Infant]: 1,
                } as any,
                str => str,
            );

            expect(result.length).toBe(2);
            expect(result[0].Icon).toBeTruthy();
            expect(result[0].label).toBe('1 x Globals.labels.child');
            expect(result[1].Icon).toBeTruthy();
            expect(result[1].label).toBe('1 x Globals.labels.infant');
        });
    });
});

describe('createDataTid', () => {
    it('Return data-tid with prefix', () => {
        expect(createDataTid('holiday-summary', 'view-booking')).toBe('view-booking-holiday-summary');
    });

    it('Return data-tid without prefix', () => {
        expect(createDataTid('holiday-summary')).toBe('holiday-summary');
    });
});
