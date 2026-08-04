import { cmsUrls } from 'code/endpoints';
import { IOffer } from 'models/data/IOffer';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import SiteSettings from 'models/enum/SiteSettings';

export const getVideoData = ({
    isSearchResultsPage,
    isPromoPage,
    layout,
    offer,
}: {
    isPromoPage: boolean;
    isSearchResultsPage: boolean;
    layout: ISitecoreLayout;
    offer: IOffer;
}) => {
    const data = {
        youtubeId: '',
        cloudinaryVideoSrc: '',
        videoPlaceholder: '',
    };
    const isNeeded = isSearchResultsPage || isPromoPage;

    if (!isNeeded) return data;

    return {
        youtubeId: layout?.sitecore?.route?.fields?.YoutubeVideoId?.value ?? offer?.hotel?.youtubeVideoId,
        cloudinaryVideoSrc: offer.hotel?.cloudinaryVideoSrc ?? '',
        videoPlaceholder:
            layout?.sitecore?.route?.fields?.VideoPlaceholder?.value?.src ??
            (offer?.hotel?.videoPlaceholder && cmsUrls.media(offer.hotel.videoPlaceholder)) ??
            '',
    };
};

export const getIsSuperDealShownStatus = ({
    isPromoPage,
    isApplySpecialFilter,
    pageName,
    offer,
    isPillVisible,
}: {
    isApplySpecialFilter: (key: string, pageName: string) => boolean;
    isPillVisible: (pillCode: SiteSettings, countryCode: string) => boolean;
    isPromoPage: boolean;
    offer: IOffer;
    pageName: string;
}): boolean => {
    /**
     * if we on promo page and this page setup in HideSuperDeals sitecore settings
     * we need don't show super deals label
     */
    if (isPromoPage && isApplySpecialFilter(SiteSettings.HideSuperDeals, pageName)) {
        return false;
    }

    /**
     * Show label if offer has distressed flights
     * and offer country isn't listed in sitecore settings with hidden SuperDeals Label
     */
    if (offer.hasDistressedFlights) {
        const countryCode = offer.hotel?.country?.code;

        return !countryCode || isPillVisible(SiteSettings.SuperDealsLabel, countryCode);
    }

    return false;
};
