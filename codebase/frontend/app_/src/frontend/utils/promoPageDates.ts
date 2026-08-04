import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { addDays } from './date.utils';

interface IPromoPageDates {
    endDate: Date;
    startDate: Date;
    initialSearchDays?: number;
}

/**
 * Parse date range for Promo page from sitecore layout.
 * If layout is invalid returns null.
 * If layout is not for Promo page returns null.
 * If StartDate or EndDate is empty returns null.
 * **If StartDate is before today then startDate will be returned as today.**
 *
 * @param layout
 */
export const getPromoPageDates = (
    layout: ISitecoreLayout,
    promoPageFrom?: Date | null,
    promoPageTo?: Date | null,
): IPromoPageDates | null => {
    const templateId = layout?.sitecore?.route?.templateId;

    if (
        !layout?.sitecore ||
        (templateId !== SitecoreTemplateId.PromoPage &&
            templateId !== SitecoreTemplateId.DynamicPromoPage &&
            templateId !== SitecoreTemplateId.RecurringPromoPage &&
            templateId !== SitecoreTemplateId.PeriodDrivenPromoPage)
    ) {
        return null;
    }

    let dates;

    if (templateId === SitecoreTemplateId.DynamicPromoPage) {
        dates = { startDate: promoPageFrom, endDate: promoPageTo };

        return dates;
    }

    if (templateId === SitecoreTemplateId.PeriodDrivenPromoPage) {
        dates = getPeriodDrivenPromoPageDates(layout);
    } else if (templateId === SitecoreTemplateId.RecurringPromoPage) {
        dates = getRecurrentPromoPageDates(layout);
    } else if (
        !!layout.sitecore.route.fields.IsMonthOnlyPage.value &&
        layout.sitecore.route.fields.EarliestDate.value
    ) {
        const startDate = new Date(layout.sitecore.route.fields.EarliestDate.value);
        startDate.setDate(1);

        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0);

        dates = { startDate, endDate };
    }

    if (dates) {
        return dates;
    }

    const hasDatesValues = layout.sitecore.route.fields.StartDate?.value && layout.sitecore.route.fields.EndDate?.value;

    if (hasDatesValues) {
        const promoPageStartDate = new Date(layout.sitecore.route.fields.StartDate.value);
        const promoPageEndDate = new Date(layout.sitecore.route.fields.EndDate.value);
        const today = new Date();

        const startDate = promoPageStartDate > today ? promoPageStartDate : today;
        const endDate = promoPageEndDate;
        const initialSearchDays = layout.sitecore.route.fields?.InitialSearchDays.value ?? null;

        return { startDate, endDate, initialSearchDays };
    }

    return null;
};

export const getRecurrentPromoPageDates = (layout: ISitecoreLayout) => {
    const daysBeforeDeparture = layout?.sitecore?.route?.fields?.MaxDaysBeforeDeparture?.value;

    if (layout?.sitecore?.route.templateId !== SitecoreTemplateId.RecurringPromoPage || !daysBeforeDeparture) {
        return null;
    }

    const startDate = new Date();
    const endDate = new Date();

    // calculate last day of the month considering the margin of daysBeforeDeparture
    endDate.setDate(endDate.getDate() + +daysBeforeDeparture);
    endDate.setDate(1);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    return { startDate, endDate };
};

/**
 * EJH-12443
 * Get dates interval from period driven promo page.
 * Increase year of dates if today date more than periodEndDate.
 *
 * @param layout
 */
export const getPeriodDrivenPromoPageDates = (layout: ISitecoreLayout) => {
    if (layout?.sitecore?.route.templateId !== SitecoreTemplateId.PeriodDrivenPromoPage) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fields = layout.sitecore.route?.fields;

    if (fields?.StartDate?.value && fields?.EndDate?.value) {
        let startDate = new Date(fields.StartDate.value);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(fields.EndDate.value);

        /** if start date month < end date month -> both dates is in the same year */
        if (startDate.getMonth() <= endDate.getMonth()) {
            startDate.setFullYear(today.getFullYear());
            endDate.setFullYear(today.getFullYear());

            const periodEndDate = new Date(endDate);
            periodEndDate.setDate(periodEndDate.getDate() - (fields?.DaysFromPeriodEndDate.value || 0));

            today.setDate(today.getDate() + 2);

            if (today.getTime() >= periodEndDate.getTime()) {
                startDate.setFullYear(startDate.getFullYear() + 1);
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
        } else {
            startDate.setFullYear(today.getFullYear() - 1);
            endDate.setFullYear(today.getFullYear());

            const periodEndDate = new Date(endDate);
            periodEndDate.setDate(periodEndDate.getDate() - (fields?.DaysFromPeriodEndDate.value || 0));

            today.setDate(today.getDate() + 2);

            if (today.getTime() >= periodEndDate.getTime()) {
                startDate.setFullYear(today.getFullYear());
                endDate.setFullYear(today.getFullYear() + 1);
            }
        }

        if (startDate.getTime() <= today.getTime()) {
            startDate = today;
        }

        return { startDate, endDate };
    }

    return null;
};

/**
 * Calculates the possible available date range for Promo Page.
 * It's from first day of month of startDate to last day of month of endDate.
 * (i.e. 15 Jun to 15 Sept - configured date range on sitecore, 1 Jun to 31 Sept - available date range)
 * @param startDate - startDate that configured on sitecore for Promo Page
 * @param endDate  - endDate that configured on sitecore for Promo Page
 */

export const getPromoPageAvailableDateRange = (startDate: Date, endDate: Date) => {
    const minFromDate = addDays(2);
    let from = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    // from date should be greater than minFromDate
    from = from > minFromDate ? from : minFromDate;

    const to = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    return { from, to };
};
