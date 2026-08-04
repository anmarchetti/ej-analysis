import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { MarketStore } from 'frontend/store/base';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBalanceHistory, IBalanceHistoryItem } from 'models/data/IBalanceHistory';
import { TSitecoreMultiList } from 'models/sitecore/generic/ISitecoreField';
import {
    CreditExpiresBannerContentType,
    ICreditExpiresContentFields,
} from 'frontend/components/renderings/CreditExpiresBanner/interfaces';
import {
    getBalanceOnStep,
    isCreditExpired,
    isCreditExpiresSoon,
    isCreditUsed,
} from 'frontend/components/renderings/HolidayCredit/utils';

export const getExpiringCreditsTotalAmount = (
    balanceHistoryItems: IBalanceHistoryItem[],
    settingExpiresWithinXDays: number,
): number[] => {
    const expiresCredits: number[] = [];
    balanceHistoryItems.forEach(item => {
        if (isCreditUsed(item) || isCreditExpired(item.expires)) {
            return;
        }

        if (isCreditExpiresSoon(item.expires, settingExpiresWithinXDays)) {
            expiresCredits.push(Math.abs(getBalanceOnStep(item, 0)));
        }
    });

    return expiresCredits;
};

export const isThereAnyExpiringCreditForOtherMarkets = (
    balanceHistory: IBalanceHistory,
    currentCurrency: CurrencyCode,
    settingExpiresWithinXDays: number,
): boolean =>
    Object.entries(balanceHistory).some(
        ([currency, items]) =>
            currency !== currentCurrency &&
            items.some(
                item =>
                    !isCreditUsed(item) &&
                    !isCreditExpired(item.expires) &&
                    isCreditExpiresSoon(item.expires, settingExpiresWithinXDays),
            ),
    );

export const getSitecoreContent = (
    fields: TSitecoreMultiList<ICreditExpiresContentFields>,
    balanceHistory: IBalanceHistory,
    currentCurrency: CurrencyCode,
    settingExpiresWithinXDays: number,
    formatMoney: MarketStore['formatMoney'],
): ICreditExpiresContentFields | undefined => {
    const expiringCreditsAmountForCurrentMarket = getExpiringCreditsTotalAmount(
        balanceHistory[currentCurrency] || [],
        settingExpiresWithinXDays,
    );
    const areCreditExpiringForOtherMarkets = isThereAnyExpiringCreditForOtherMarkets(
        balanceHistory,
        currentCurrency,
        settingExpiresWithinXDays,
    );

    let contentType: CreditExpiresBannerContentType | undefined = undefined;

    if (areCreditExpiringForOtherMarkets && expiringCreditsAmountForCurrentMarket.length) {
        contentType = CreditExpiresBannerContentType.CreditExpiresOnMultipleMarkets;
    }

    if (areCreditExpiringForOtherMarkets && !expiringCreditsAmountForCurrentMarket.length) {
        contentType = CreditExpiresBannerContentType.CreditExpiresOnOtherMarkets;
    }

    if (!areCreditExpiringForOtherMarkets && expiringCreditsAmountForCurrentMarket.length) {
        contentType = CreditExpiresBannerContentType.CreditExpiresCurrentMarket;
    }

    const content = fields.find(item => item.fields.ContentType.value === contentType)?.fields;

    if (!content) {
        return undefined;
    }

    const totalExpiringCredits = expiringCreditsAmountForCurrentMarket.reduce((acc, credit) => acc + credit, 0);

    return {
        ...content,
        Title: {
            value: Tokenizer.replaceToken(
                content?.Title?.value,
                Tokens.Amount,
                formatMoney(totalExpiringCredits, {
                    currency: currentCurrency,
                }),
            ),
        },
    };
};
