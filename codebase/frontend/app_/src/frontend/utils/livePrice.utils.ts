import qs from 'qs';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { addDays, parseDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IDestination } from 'models/data/IDestination';
import { IDestinationFields } from 'models/data/IDestinationFields';
import {
    ILivePrice,
    ILivePriceCriteria,
    ILivePriceNamedSearchesFields,
    ISearchQueryParams,
} from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { IRequestedPrice, IRequestedPriceValues } from 'models/data/IRequestedPrice';
import { PriceMathFunction } from 'models/enum/PriceMathFunction';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';

import { getRegionsCodesRelatedToVirtual, getSortItemBySitecoreConfig } from './search/search.utils';
import { buildGeogParamByRelatedRegionsQuery, parseQuery } from './url.utils';

/** Build a code to send to live price api */
export const buildLivePriceCode = (destCode: string, searchName?: string): string =>
    `${destCode}${searchName ? `.${searchName}` : ''}`;

/** Build codes to send to live price api by criteria items */
export const buildLivePriceCodes = (criteriaItems: ILivePriceCriteria[]): string[] => {
    const livePriceCodes = criteriaItems.reduce((resCodes, item) => {
        const destCodes = item.relatedRegions?.length ? item.relatedRegions : [item.destinationCode];
        const priceCodes = destCodes.map(code => buildLivePriceCode(code, item.searchName));

        return resCodes.concat(priceCodes);
    }, [] as string[]);

    return Array.from(new Set(livePriceCodes));
};

export const getDestinationLivePriceByCode = <T extends ILivePrice>(
    destCode: string | undefined,
    prices: T[] = [],
): Nullable<T> => (destCode && prices.find(item => item.geog === destCode)) || null;

export const getDestinationLivePriceByAccomCode = <T extends ILivePrice>(
    accomCode: string | undefined,
    prices: T[] = [],
): Nullable<T> => (accomCode && prices.find(item => item.accomCode === accomCode)) || null;

/**
 * Get the cheapest live price of related regions or destination itself.
 */
export const getLivePriceOfDestinationWithRegions = (
    destFields: IDestinationFields | undefined,
    relatedRegion: string[],
    prices: ILivePrice[],
): Nullable<ILivePrice> => {
    if (!destFields) {
        return null;
    }

    const destCode = destFields.GiataCode?.value || destFields.Code?.value || '';

    if (relatedRegion.length) {
        return relatedRegion.reduce((cheapestPrice, regionCode) => {
            const price = getDestinationLivePriceByCode(regionCode, prices);

            return price && (!cheapestPrice || price.pricePP < cheapestPrice.pricePP) ? price : cheapestPrice;
        }, null as Nullable<ILivePrice>);
    }

    return getDestinationLivePriceByCode(destCode, prices);
};

export const isLivePriceEnabledForDestinationPage = (
    pageCode: string,
    parents: IDestination[] = [],
    relatedRegions: string[] = [],
    excludedDestinations: string[] = [],
): boolean => {
    if (excludedDestinations.length === 0) {
        return true;
    }

    // Live price is disabled, if it's disabled for ALL related regions.
    if (
        relatedRegions.length > 0 &&
        relatedRegions.every(relatedRegion => excludedDestinations.includes(relatedRegion))
    ) {
        return false;
    }

    return !excludedDestinations.some(
        destination => destination === pageCode || parents.some(parent => destination === parent.code),
    );
};

export const getSearchQueryParamsByPrice = <T extends ILivePrice>(price: T): ISearchQueryParams => {
    const startDate = parseDateL10n(price.searchCriteria.date, DATE_FORMATS.query) as Date;
    const endDate = addDays(price.searchCriteria.duration, startDate);

    return {
        accomCode: price.accomCode,
        endDate,
        geog: price.geog,
        rooms: [
            {
                adults: price.searchCriteria.adults,
                children: price.searchCriteria.children,
                childrenAges: price.searchCriteria.childAges || [],
                infants: price.searchCriteria.infants,
            },
        ],
        startDate,
    };
};

export const getLivePriceCriterion = (
    LinkedDestination: ISitecoreCompositeField<IDestinationFields>[] | undefined,
    LivePriceNamedSearches: ISitecoreCompositeField<ILivePriceNamedSearchesFields> | undefined,
): ILivePriceCriteria | undefined => {
    const destFields = LinkedDestination?.[0]?.fields;
    const destinationCode = destFields?.GiataCode?.value || destFields?.Code?.value;
    const searchName = LivePriceNamedSearches?.fields?.Name?.value;

    if (destinationCode && searchName) {
        return {
            destinationCode,
            relatedRegions: getRegionsCodesRelatedToVirtual(destFields),
            searchName,
        };
    }

    return undefined;
};

export const getLivePriceCriteriaOfPromoBlocks = (items: IPromoBlockFields[]): ILivePriceCriteria[] =>
    items.reduce((criteriaList, item) => {
        const { LinkedDestination, LivePriceNamedSearches } = item.fields || {};
        const livePriceCriterion = getLivePriceCriterion(LinkedDestination, LivePriceNamedSearches);

        if (livePriceCriterion) {
            criteriaList.push(livePriceCriterion);
        }

        return criteriaList;
    }, [] as ILivePriceCriteria[]);

export const setLivePricesToPromoBlocks = (items: IPromoBlockFields[], prices: ILivePrice[]): IPromoBlockFields[] =>
    items.map(item => {
        const destFields = item.fields?.LinkedDestination?.[0]?.fields;
        const livePrice = getLivePriceOfDestinationWithRegions(
            destFields,
            getRegionsCodesRelatedToVirtual(destFields),
            prices,
        );

        return {
            ...item,
            livePrice,
            isLivePriceValid: !!livePrice?.pricePP,
        };
    });

export const formatRequestedPrice = (
    priceValues: IRequestedPriceValues | undefined,
    isPricePP: boolean,
    formatMoney: (amount: number) => string,
): string => {
    if (!priceValues) return '';

    const price = isPricePP ? priceValues.pricePP : priceValues.price;

    return price ? formatMoney(price) : '';
};

export const getRequestedPriceAmountText = (
    requestedPrice: IRequestedPrice,
    priceMathFunction: PriceMathFunction,
    isPricePP: boolean,
    formatMoney: (amount: number) => string,
): string => {
    const requestedPriceValuesByFunction = getRequestedPriceValues(requestedPrice, priceMathFunction);

    if (Array.isArray(requestedPriceValuesByFunction)) {
        const min = formatRequestedPrice(requestedPriceValuesByFunction[0], isPricePP, formatMoney);
        const max = formatRequestedPrice(requestedPriceValuesByFunction[1], isPricePP, formatMoney);

        return `${min} - ${max}`;
    }

    return formatRequestedPrice(requestedPriceValuesByFunction, isPricePP, formatMoney);
};

type TRequestedPriceValueOrUndefined = IRequestedPriceValues | undefined;

export const getRequestedPriceValues = (
    requestedPrice: IRequestedPrice | null,
    priceMathFunction: PriceMathFunction | undefined,
): TRequestedPriceValueOrUndefined | [TRequestedPriceValueOrUndefined, TRequestedPriceValueOrUndefined] => {
    if (!requestedPrice || !priceMathFunction) {
        return undefined;
    }

    const { requestedPriceByMathFunctions } = requestedPrice;

    if (priceMathFunction === PriceMathFunction.Range) {
        const min = requestedPriceByMathFunctions[PriceMathFunction.Cheapest];
        const max = requestedPriceByMathFunctions[PriceMathFunction.MostExpensive];

        return [min, max];
    }

    return requestedPriceByMathFunctions[priceMathFunction];
};

export const isRequestedPriceValuesValid = (reqPrice: Nullable<IRequestedPriceValues>, isPricePP: boolean): boolean => {
    if (!reqPrice) return false;

    const price = isPricePP ? reqPrice?.pricePP : reqPrice?.price;

    if (!price) return false;

    return true;
};

export const isRequestedPriceInputValid = (
    value: Nullable<IRequestedPriceValues> | Nullable<IRequestedPriceValues>[],
    isPricePP: boolean,
): boolean => {
    if (Array.isArray(value)) {
        return value.every(v => isRequestedPriceValuesValid(v, isPricePP));
    }

    return isRequestedPriceValuesValid(value, isPricePP);
};

export const getRequestedPriceDictionary = (
    priceMathFunction: PriceMathFunction,
    isPricePP: boolean,
): SitecoreDictionary | undefined => {
    if (priceMathFunction === PriceMathFunction.Cheapest) {
        return isPricePP
            ? SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom
            : SitecoreDictionary.GlobalsPriceLabelsFrom;
    }

    return isPricePP ? SitecoreDictionary.GlobalsPriceLabelsPerPerson : undefined;
};

export const buildRequestedPriceUrl = (
    requestedPriceUrl: string | undefined,
    sortOrder?: ISortOrderItem,
    destination?: string,
    relatedRegions?: string[],
): Nullable<string> => {
    if (!requestedPriceUrl) return null;

    const [path, search] = requestedPriceUrl.split('?');
    const query = parseQuery(search);

    if (destination) {
        query[QueryParamName.Destination] = destination;

        if (relatedRegions?.length) {
            query[QueryParamName.Geog] = buildGeogParamByRelatedRegionsQuery(relatedRegions);
        }
    }

    const sortItem = getSortItemBySitecoreConfig(sortOrder);

    if (sortItem) {
        query[QueryParamName.OrderBy] = sortItem.orderBy;
        query[QueryParamName.OrderDirection] = sortItem.orderDirection;
    }

    return `${path}?${qs.stringify(query, { encode: false, arrayFormat: 'comma' })}`;
};

export const getLivePriceNumberOfNightsLabel = (
    getPhrase: (key: string) => string,
    duration: number = 0,
    suffix: string = '',
): string => {
    if (!duration) {
        return suffix;
    }

    const numberOfNightsLabel = Tokenizer.replaceToken(
        duration !== 1
            ? getPhrase(SitecoreDictionary.GlobalsLabelsNumberOfNights)
            : getPhrase(SitecoreDictionary.GlobalsLabelsNumberOfNight),
        Tokens.Count,
        duration.toString(),
    );

    return !!numberOfNightsLabel ? `${numberOfNightsLabel} ${suffix}` : suffix;
};

export const getActualPrice = (
    livePrice: Nullable<ILivePrice>,
    offer: IOffer,
): { price: number; priceExcludingTouristTax: number; pricePP: number; pricePPExcludingTouristTax: number } => {
    const { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax } = livePrice || offer;

    return { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax };
};

export const getCheapestLivePrice = (prices: ILivePrice[]): ILivePrice | null =>
    prices.reduce(
        (cheapestPrice: ILivePrice | null, price) =>
            !cheapestPrice || price.pricePP < cheapestPrice.pricePP ? price : cheapestPrice,
        null,
    );
