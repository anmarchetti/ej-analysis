import { DAYS_IN_MONTH, HOURS_PER_DAY } from 'code/commonNumbers';
import { CurrencyCode } from 'code/currency';
import { getDaysDifference, getTotalHoursDifference } from 'frontend/utils/date.utils';
import { IBalanceHistoryFields, IBalanceHistoryItem, IMetadata } from 'models/data/IBalanceHistory';
import { IMarketCredits, IMarketTab, IMyCreditInfo } from 'models/data/MyCreditInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { BalanceOrderStatuses } from './components/BalanceHistoryChip/BalanceHistoryChip';
import {
    META_BOOKING_REF,
    META_CURRENCY,
    META_HOTEL_COUNTRY_NAME,
    META_HOTEL_COUNTRY_OBJECT_OBSOLETE,
    META_HOTEL_NAME,
    META_ORIGINAL_VOUCHER_CODE,
    META_SOURCE,
    STATUS_CANCELED,
} from './constants';

export const getMetaDataByKey = (metadata: IMetadata[], key: string): IMetadata | undefined =>
    metadata.find(item => item.key === key);

export const getMetaDataValueByKey = (metadata: IMetadata[], key: string): any =>
    getMetaDataByKey(metadata, key)?.value;

export const getRedemptionOrigin = (metadata: IMetadata[] | undefined, getPhrase: (key: string) => string): string => {
    if (!metadata?.length) {
        return '';
    }

    /**Walker crisps */
    if (getMetaDataByKey(metadata, META_ORIGINAL_VOUCHER_CODE)) {
        const promotionCampaign = getMetaDataValueByKey(metadata, META_SOURCE);

        return `${promotionCampaign} ${getPhrase(SitecoreDictionary.RedeemVoucherLabelsPromotion)}`;
    }

    const hotelName = getMetaDataValueByKey(metadata, META_HOTEL_NAME);
    const hotelCountry =
        getMetaDataValueByKey(metadata, META_HOTEL_COUNTRY_NAME) ??
        getMetaDataValueByKey(metadata, META_HOTEL_COUNTRY_OBJECT_OBSOLETE)?.Name;

    return hotelName && hotelCountry ? `${hotelName}, ${hotelCountry}` : '';
};

export const getRedemptionBookingRef = (metadata: IMetadata[]): any =>
    getMetaDataValueByKey(metadata, META_BOOKING_REF) ?? '';

export const getOriginalVoucherCode = (metadata: IMetadata[]): any =>
    getMetaDataValueByKey(metadata, META_ORIGINAL_VOUCHER_CODE) ?? '';

export const getHistoryItemCurrency = (item: IBalanceHistoryItem): CurrencyCode | undefined =>
    getMetaDataValueByKey(item.metadata, META_CURRENCY);

export const getMarketSitecoreContent = (
    currency: CurrencyCode,
    markets: ISitecoreCompositeField<IMarketCredits>[] = [],
): {
    flag: ISitecoreField<ISitecoreImage> | undefined;
    screenReaderLabel: ISitecoreField<string> | undefined;
} => {
    const market = markets.find(market => market.fields?.Market?.fields?.Currency?.fields?.Code?.value === currency);

    return {
        flag: market?.fields?.Flag,
        screenReaderLabel: market?.fields?.ScreenReaderLabel,
    };
};

export const getCreditTabs = (
    tabSettings: ISitecoreCompositeField<IMarketCredits>[] | undefined,
    balances: IMyCreditInfo[],
    marketCurrency: CurrencyCode,
): IMarketTab[] => {
    if (!balances.length) {
        return [];
    }

    const marketCreditIndex = balances.findIndex(balance => balance.currency === marketCurrency);

    // The first tab should show credit in the market currency.
    // If there is no market credit, show 0 (EUX-476, scenario 6)
    const tabs =
        marketCreditIndex === -1
            ? [
                  {
                      balance: 0,
                      currency: marketCurrency,
                      hasCreditHistory: false,
                  } as IMyCreditInfo,
                  ...balances,
              ]
            : [
                  balances[marketCreditIndex],
                  ...balances.slice(0, marketCreditIndex),
                  ...balances.slice(marketCreditIndex + 1),
              ];

    return tabs.map(credit => ({ ...credit, ...getMarketSitecoreContent(credit.currency, tabSettings) }));
};

export const getBalanceOnStep = ({ redemptions, order }: IBalanceHistoryItem, step: number): number => {
    const reverseRed = redemptions.slice().reverse();
    const steps = reverseRed.slice(0, redemptions.length - step);

    return steps.reduce((sum, redemption) => redemption.order.amount + sum, order.amount);
};

export const isCreditExpired = (expires: string): boolean => new Date(expires) < new Date();

export const isCreditUsed = (creditItem: IBalanceHistoryItem): boolean => getBalanceOnStep(creditItem, 0) < 0.01;

export const isCreditExpiresSoon = (expires: string, expireSoonWithinDays = DAYS_IN_MONTH): boolean => {
    const daysDifference = getDaysDifference(new Date(expires), new Date());

    return daysDifference <= expireSoonWithinDays && daysDifference >= 0;
};

export const getCreditStatus = (
    creditItem: IBalanceHistoryItem,
    expireSoonWithinDays = DAYS_IN_MONTH,
): BalanceOrderStatuses => {
    if (isCreditUsed(creditItem)) {
        return BalanceOrderStatuses.Used;
    }

    if (isCreditExpired(creditItem.expires)) {
        return BalanceOrderStatuses.Expired;
    }

    if (isCreditExpiresSoon(creditItem.expires, expireSoonWithinDays)) {
        return BalanceOrderStatuses.ExpireSoon;
    }

    return BalanceOrderStatuses.Active;
};

export const getExpireSoonLabel = (
    expirationDate: string,
    fields: IBalanceHistoryFields,
    getPhrase: (key: string) => string,
    isMobile?: boolean,
): string => {
    const { ExpiresInShortLabel, ExpiresInLabel, ExpireSoonWithinDays } = fields;

    const daysDifference = getDaysDifference(new Date(expirationDate), new Date(), true);

    if (daysDifference <= ExpireSoonWithinDays?.value && daysDifference > 1) {
        const daysLabel = `${Math.round(daysDifference)} ${getPhrase(
            daysDifference > 1
                ? SitecoreDictionary.GlobalsLabelsTimeDaysPlural
                : SitecoreDictionary.GlobalsLabelsTimeDaySingular,
        )}`;

        return isMobile ? `${ExpiresInShortLabel.value} ${daysLabel}` : `${ExpiresInLabel.value} ${daysLabel}`;
    }

    const hoursDifference = getTotalHoursDifference(new Date(expirationDate), new Date());

    if (hoursDifference <= HOURS_PER_DAY && hoursDifference >= 0) {
        const hoursLabel = `${hoursDifference} ${getPhrase(
            hoursDifference > 1
                ? SitecoreDictionary.GlobalsLabelsTimeHoursPlural
                : SitecoreDictionary.GlobalsLabelsTimeHoursSingular,
        )}`;

        return isMobile ? `${ExpiresInShortLabel.value} ${hoursLabel}` : `${ExpiresInLabel.value} ${hoursLabel}`;
    }

    return '';
};

export const getSubItemLabel = (
    status: string | undefined,
    isAmountMoreThanZero: boolean,
    fields: IBalanceHistoryFields,
    holidayRef: string,
    creditTypeTitle?: string,
): string => {
    const { CreditLabel, PurchaseLabel, FailureLabel } = fields;

    if (status === STATUS_CANCELED) {
        return FailureLabel.value;
    }

    if (isAmountMoreThanZero) {
        return creditTypeTitle || CreditLabel.value;
    }

    return `${PurchaseLabel.value} ${holidayRef}`;
};
