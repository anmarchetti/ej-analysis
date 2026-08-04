import { ITrackingFields } from 'models/data/IHolidayInspiration';
import { ICoreParams } from 'models/data/tracking/ICoreParams';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export const getQuizEventsCoreParamsOverride = (fields: Nullable<ITrackingFields>): Partial<ICoreParams> => {
    const identifyingUrl = getQuizTabIdentifyingUrl(fields?.TrackingItemName);

    return {
        pageUrl: identifyingUrl,
    };
};

export const getQuizTabIdentifyingUrl = (trackingItemName: ISitecoreField<string> | undefined): string => {
    const { origin, pathname, search } = window.location;
    const formattedTrackingItemName = trackingItemName?.value.toLowerCase().replaceAll(' ', '-') || '';

    return `${origin}${pathname}/quiz/${formattedTrackingItemName}${search}`;
};

export const getFlexibilityTrackingLabel = (flexibleDays: number | undefined): string | null =>
    flexibleDays !== undefined ? `+/- ${flexibleDays} Day` : null;
