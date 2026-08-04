import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { DestinationType } from 'models/enum/DestinationType';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import { removePrefixes } from './array.utils';
import { getIDestinationByCode, getIDestinationByName } from './destinations.utils';
import { getLastUrlSegment } from './url.utils';

/** Find destination by parsing url. (Dynamic Promo Page has url like en/holidays/<holiday type>/<destination name>) */
export const getPromoPageDestinationByUrl = (url: string, destinations: IDestinationCountry[]): IDestination | null => {
    if (!destinations?.length) {
        return null;
    }

    const destinationName = getLastUrlSegment(url);

    return getIDestinationByName(destinations, destinationName);
};

/**
 * Checks if a sitecore item is a hotel.
 */
const isHotelDestinationItem = (sitecoreItem: ISitecoreCompositeField<any>): boolean =>
    // Check PageCategory or, if it's missing, some field that only hotels have (e.g. HotelDescription)
    sitecoreItem.fields.PageCategory?.value === DestinationType.Hotel || !!sitecoreItem.fields.HotelDescription;
/**
 * Finds all hotels in sitecore treelist and converts them to IDestination list.
 */
export const getHotelsIDestinations = (sitecoreItems: ISitecoreCompositeField<any>[]): IDestination[] =>
    sitecoreItems
        .filter(d => isHotelDestinationItem(d))
        .map(d => ({
            code: d.fields.Code?.value || d.fields.GiataCode?.value,
            name: d.fields.Name?.value,
            type: DestinationType.Hotel,
            showOnSearchPod: d.fields.ShowOnSearchPod?.value,
        }));

/**
 * Converts sitecore treelist to IDestination list
 */
export const convertSitecoreItemsToIDestinations = (
    sitecoreItems: ISitecoreCompositeField<any>[],
    destinations: IDestinationCountry[],
): IDestination[] =>
    sitecoreItems.reduce((res, destination) => {
        const code = destination.fields.Code?.value;
        const name = destination.fields.Name?.value;
        const dst =
            (code && getIDestinationByCode(destinations, code)) ||
            (name && getIDestinationByName(destinations, name)) ||
            null;

        if (dst) {
            res.push(dst);
        }

        return res;
    }, [] as IDestination[]);

/**
 * Define theme codes that need send to api, because selected filters on ui and sending filters to api may differ.
 * E.g. it's promo page with "City Boutique" type, on UI user can select "City", but we send to api only "City Boutique".
 * @param selectedThemes - themes/types codes that selected on UI
 * @param promoThemes - themes/types codes that configured  on promo page
 */
export const getPromoPackageThemesFilters = (selectedThemes: string[], promoThemes: string[]): string[] => {
    // if promo page doesn't have configured themes, then any themes can be sent
    if (!promoThemes.length) {
        return selectedThemes;
    }

    // if there are no selected themes, send configured themes
    if (!selectedThemes.length) {
        return promoThemes;
    }

    return removePrefixes([...selectedThemes, ...promoThemes]);
};
