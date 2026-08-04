import { ENGLISH, getCMSLang } from 'code/cmsLang';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IDestination } from 'models/data/IDestination';
import { IExcursion, IExcursionResponse } from 'models/data/IExcursions';
import { IHotel } from 'models/data/IHotel';
import { MarketCode } from 'models/data/MarketSettings';
import ExcursionsUTMCampaignsValues from 'models/enum/ExcursionsUTMCampaignsValues';
import UtmTagsName from 'models/enum/UtmTagsName';

export const DESKTOP_ITEMS_AMOUNT = 3;
export const TABLET_ITEMS_AMOUNT = 2;
export const HORIZONTAL_VIEW_AMOUNT = 1;
const UTM_MEDIUM_VALUE = 'web';
const EXCURSIONS_LANG_MAP = {
    en: 'en-GB',
    fr: 'fr-FR',
    de: 'de-DE',
    'ch-fr': 'fr-FR',
    'ch-de': 'de-DE',
};

const getSign = (link: string): string => (link.includes('?') ? '&' : '?');

const replaceSpaceToDashInString = (hotel: IHotel | undefined): string =>
    `${hotel?.country.itemName}-${hotel?.location.itemName}-${hotel?.resort.itemName}`.replace(/ /g, '-');

const getFullDestinationPath = (destinationParents: IDestination[], layoutName: string) => {
    const destinationPath = destinationParents.reduce(
        (acc, parent) => (parent.itemName ? `${parent.itemName.toLowerCase()}-${acc}` : acc),
        layoutName.toLowerCase(),
    );

    return destinationPath.replace(/ /g, '-');
};

const getUtmTaggingKeyValue = (
    excursionsDestination: string,
    sign: string,
    isConfirmationPage: boolean,
    isViewBookingPage: boolean,
    siteLang: string,
): string => {
    const cmsLang = getCMSLang(siteLang);
    const region = siteLang === ENGLISH ? MarketCode.UK : cmsLang.split('-')[1];
    const language = EXCURSIONS_LANG_MAP[siteLang] || cmsLang;

    let UTMCampaignValue = ExcursionsUTMCampaignsValues.DestinationGuides;

    if (isConfirmationPage) {
        UTMCampaignValue = ExcursionsUTMCampaignsValues.BookingConfirmationPage;
    }

    if (isViewBookingPage) {
        UTMCampaignValue = ExcursionsUTMCampaignsValues.ViewBookingPage;
    }

    return `${sign}${UtmTagsName.UtmSource}=${region}-${language}-${UTMCampaignValue}&${UtmTagsName.UtmCampaign}=${excursionsDestination}&${UtmTagsName.UtmMedium}=${UTM_MEDIUM_VALUE}`;
};

const addUtmTaggingToExcursions = (
    excursions: IExcursion[],
    utmValue: string,
    isConfirmationPage: boolean,
    isViewBookingPage: boolean,
    siteLang: string,
): IExcursion[] => {
    if (!excursions.length) {
        return excursions;
    }

    return excursions.map(item => {
        const excursionLink = getUtmTaggingKeyValue(
            utmValue,
            getSign(item.url),
            isConfirmationPage,
            isViewBookingPage,
            siteLang,
        );

        const url = `${item.url}${excursionLink}`;

        return {
            ...item,
            url,
        };
    });
};

const addUtmTaggingToExcursionsLink = (
    link: string,
    utmValue: string,
    isConfirmationPage: boolean,
    isViewBookingPage: boolean,
    siteLang: string,
): string => {
    if (!link || !utmValue) {
        return link;
    }

    const excursionsLink = getUtmTaggingKeyValue(
        utmValue,
        getSign(link),
        isConfirmationPage,
        isViewBookingPage,
        siteLang,
    );

    return `${link}${excursionsLink}`;
};

export const getExcursionLinkAndExcursionsWithUtmTagging = (
    result: IExcursionResponse,
    isDestinationPage: boolean,
    isConfirmationPage: boolean,
    isViewBookingPage: boolean,
    confirmationBooking: Nullable<IBookingInfo>,
    viewBooking: Nullable<IBookingInfo>,
    siteLang: string,
    destinationParents: IDestination[],
    layoutName: string,
): { excursions: IExcursion[]; excursionsLink: string; utmValue: string } => {
    let excursionsLink: string = result.excursionsLink;
    let excursions: IExcursion[] = result.excursions;
    let utmValue = '';

    if (isDestinationPage) {
        utmValue = getFullDestinationPath(destinationParents, layoutName);

        excursionsLink = addUtmTaggingToExcursionsLink(
            result.excursionsLink,
            utmValue,
            isConfirmationPage,
            isViewBookingPage,
            siteLang,
        );
        excursions = addUtmTaggingToExcursions(
            result.excursions,
            utmValue,
            isConfirmationPage,
            isViewBookingPage,
            siteLang,
        );
    } else if ((isConfirmationPage && confirmationBooking?.hotel) || (isViewBookingPage && viewBooking?.hotel)) {
        const hotel = confirmationBooking?.hotel ?? viewBooking?.hotel;

        utmValue = replaceSpaceToDashInString(hotel);
        excursionsLink = addUtmTaggingToExcursionsLink(
            result.excursionsLink,
            utmValue,
            isConfirmationPage,
            isViewBookingPage,
            siteLang,
        );
        excursions = addUtmTaggingToExcursions(
            result.excursions,
            utmValue,
            isConfirmationPage,
            isViewBookingPage,
            siteLang,
        );
    }

    return { excursionsLink, excursions, utmValue };
};

export const hideArrows = (excursions: IExcursion[], isScreenMedium: boolean, isScreenLarge: boolean): boolean => {
    if (!excursions.length) {
        return true;
    }

    if (!isScreenMedium) {
        return true;
    }

    if (excursions.length <= DESKTOP_ITEMS_AMOUNT && isScreenLarge) {
        return true;
    }

    return excursions.length <= TABLET_ITEMS_AMOUNT && !isScreenLarge && isScreenMedium;
};

export const getViewBookingStatusPageData = (
    booking: Nullable<IBookingInfo>,
    isDestinationPage: boolean,
    isConfirmationPage: boolean,
    hasLocation: boolean,
): {
    isViewBookingStatusPage: boolean;
    viewBookingStatusPageBookingEndDate: string;
    viewBookingStatusPageBookingStartDate: string;
    viewBookingStatusPageLocation: string;
} => {
    const isViewBookingStatusPage = !isDestinationPage && !isConfirmationPage && !hasLocation;
    const viewBookingStatusPageLocation = booking?.hotel?.location?.code || '';
    const viewBookingStatusPageBookingStartDate = booking?.package?.accom?.startDate || '';
    const viewBookingStatusPageBookingEndDate = booking?.package?.accom?.endDate || '';

    return {
        isViewBookingStatusPage,
        viewBookingStatusPageLocation,
        viewBookingStatusPageBookingStartDate,
        viewBookingStatusPageBookingEndDate,
    };
};

export const getShowDots = (excursionsCount: number, isMobile: boolean, isScreenLarge: boolean): boolean => {
    if (isMobile) {
        return excursionsCount > HORIZONTAL_VIEW_AMOUNT;
    }

    if (isScreenLarge) {
        return excursionsCount > DESKTOP_ITEMS_AMOUNT;
    }

    return excursionsCount > TABLET_ITEMS_AMOUNT;
};
