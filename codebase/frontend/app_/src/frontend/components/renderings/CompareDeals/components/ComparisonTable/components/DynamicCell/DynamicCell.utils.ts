import { DATE_FORMATS } from 'code/dates';
import { LayoutStore } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getExtraLuggageFromLivePriceAndOffer, isMatchingLuggageIcon } from 'frontend/utils/luggage.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { getTransferFromLivePriceAndOffer } from 'frontend/utils/transfer.utils';
import { IFacilityGroup, IThemePackageIcon } from 'models/data/IHotel';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';

const MAX_FACILITY_NUMBER = 4;

export const getDates = (offer: IOffer): string | null => {
    const depDate = offer.transport.routes[0].arrDate;
    const arrDate = offer.transport.routes[1].arrDate;

    if (!depDate || !arrDate) {
        return null;
    }

    const formattedDepDate = formatDateL10n(depDate, DATE_FORMATS.DayAndMonthAbbr);
    const formattedArrDate = formatDateL10n(arrDate, DATE_FORMATS.DayAndMonthAbbr);

    return `${formattedDepDate} - ${formattedArrDate}`;
};

export const getFlightTime = (offer: IOffer, direction: 0 | 1): string | null => {
    const from = offer.transport.routes[direction].depDate;
    const to = offer.transport.routes[direction].arrDate;

    if (!from || !to) {
        return null;
    }

    const depFromStartTime = formatDateL10n(from, DATE_FORMATS.time);
    const depFromEndTime = formatDateL10n(to, DATE_FORMATS.time);

    return `${depFromStartTime} - ${depFromEndTime}`;
};

export const getStayData = (offer: IOffer, getPhrase: LayoutStore['getPhrase']): string | null => {
    const stayLabel =
        offer.accom.stay > 1
            ? getPhrase(SitecoreDictionary.GlobalsLabelsNightsPlural)
            : getPhrase(SitecoreDictionary.GlobalsLabelsNightSingular);

    return offer.accom.stay ? `${offer.accom.stay} ${stayLabel}` : null;
};

export const isLuxuryContent = (offer: IOffer): boolean => {
    const promoCollections =
        offer.promoCollections ?? offer.hotel?.promoCollections ?? offer.livePrice?.promoCollections;

    return containsLuxuryPromoCode(promoCollections);
};

export const getBagsData = (
    offer: IOffer,
    isOfferFromAnotherMarket: boolean,
    getPhrase: (key: string) => string,
): string[] => {
    if (isLuxuryContent(offer)) {
        return [getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagPlural)];
    }

    const packageIcons: IThemePackageIcon[] = offer.accom?.theme?.packageIcons ?? [];

    const extraLuggage = isOfferFromAnotherMarket
        ? undefined
        : getExtraLuggageFromLivePriceAndOffer(offer?.livePrice, offer);

    const underSeatBagIcon = packageIcons.find(icon => icon.key === PackageIconTypes.UnderSeatBag);

    const bagsData = packageIcons.filter(icon => {
        if (icon.key === PackageIconTypes.Bags) {
            return isMatchingLuggageIcon(extraLuggage, icon);
        }

        return false;
    });

    if (!bagsData.length && underSeatBagIcon && extraLuggage !== undefined) {
        bagsData.push(underSeatBagIcon);
    }

    return bagsData.map(icon => icon?.name);
};

export const getFacilityData = (facilityGroup: IFacilityGroup[] | undefined): string[] => {
    const overviewFacility = facilityGroup?.find(facility => facility.code === VirtualFacilityGroupCode.Overview);

    return overviewFacility?.items.slice(0, MAX_FACILITY_NUMBER).map(item => item.name) ?? [];
};

export const getTransferName = (
    livePrice: Nullable<ILivePrice>,
    offer: IOffer,
    isOfferFromAnotherMarket: boolean,
    getPhrase: (key: string) => string,
): Nullable<string> => {
    if (isLuxuryContent(offer)) {
        return getPhrase(SitecoreDictionary.TransferLabelsPrivateTransfer);
    }

    if (isOfferFromAnotherMarket) {
        return null;
    }

    return getTransferFromLivePriceAndOffer(livePrice, offer)?.name;
};
