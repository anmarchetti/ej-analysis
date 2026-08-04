import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { getPromoPageDates } from './promoPageDates';

describe('getPromoPageDates', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    it('should return null for layout without sitecore', () => {
        const result = getPromoPageDates(null as any);
        expect(result).toBeNull();
    });

    it('should return null when templateId is not promo-related', () => {
        const layout = {
            sitecore: {
                route: {
                    templateId: 'not-promo-id',
                },
            },
        } as any;

        expect(getPromoPageDates(layout)).toBeNull();
    });

    it('should return startDate from today when original StartDate is before today', () => {
        const layout = {
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.PromoPage,
                    fields: {
                        StartDate: { value: '2000-01-01' },
                        EndDate: { value: '2100-01-01' },
                        InitialSearchDays: { value: 15 },
                        IsMonthOnlyPage: { value: null },
                        EarliestDate: { value: null },
                    },
                },
            },
        } as any;

        const result = getPromoPageDates(layout);
        expect(result).not.toBeNull();
        expect(result!.startDate.getFullYear()).toBe(today.getFullYear());
        expect(result!.initialSearchDays).toBe(15);
    });

    it('should use promoPageFrom and promoPageTo when templateId is DynamicPromoPage', () => {
        const from = new Date('2025-10-01');
        const to = new Date('2025-10-10');

        const layout = {
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.DynamicPromoPage,
                    fields: {},
                },
            },
        } as any;

        const result = getPromoPageDates(layout, from, to);
        expect(result).toEqual({ startDate: from, endDate: to });
    });

    it('should return MonthOnlyPage dates based on EarliestDate', () => {
        const earliest = new Date('2025-06-15');
        const layout = {
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.PromoPage,
                    fields: {
                        IsMonthOnlyPage: { value: true },
                        EarliestDate: { value: earliest.toISOString() },
                    },
                },
            },
        } as any;

        const result = getPromoPageDates(layout);
        expect(result).not.toBeNull();
        expect(result!.startDate.getDate()).toBe(1);
        expect(result!.endDate.getDate()).toBeGreaterThan(25);
    });

    it('should return null when no valid date fields exist', () => {
        const layout = {
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.PromoPage,
                    fields: {
                        IsMonthOnlyPage: { value: false },
                        EarliestDate: { value: null },
                        StartDate: null,
                        EndDate: null,
                    },
                },
            },
        } as any;

        const result = getPromoPageDates(layout);
        expect(result).toBeNull();
    });
});
