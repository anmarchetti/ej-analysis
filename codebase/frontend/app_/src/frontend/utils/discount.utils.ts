import { ONE_HUNDRED } from 'code/commonNumbers';
import { CurrencyCode, ICurrencyFormatOptions, TrailingZeroDisplay } from 'code/currency';
import { MarketStore } from 'frontend/store/base';
import { IPromotionCodeTier, ISinglePromotionInfo } from 'models/data/IPromocode';

export const getDiscount = (
    promotion: ISinglePromotionInfo | IPromotionCodeTier,
    currency: CurrencyCode,
    formatMoney: MarketStore['formatMoney'],
): string => {
    if (promotion.discountAmountPerBooking) {
        return formatMoney(promotion.discountAmountPerBooking, {
            currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
    }

    if (promotion.percentageDiscountPerBooking) {
        return `${promotion.percentageDiscountPerBooking * ONE_HUNDRED}%`;
    }

    return '';
};

export const getDiscountPerPerson = (
    promotion: ISinglePromotionInfo | IPromotionCodeTier,
    currency: CurrencyCode,
    formatMoney: (amount: number, options?: ICurrencyFormatOptions) => string,
    labelBeforePrice: string,
    labelAfterPrice: string,
): string => {
    let discountValue = '';

    if (promotion.discountAmountPerPerson) {
        discountValue = formatMoney(promotion.discountAmountPerPerson, {
            currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
    } else if (promotion.discountPercentagePerPerson) {
        discountValue = `${promotion.discountPercentagePerPerson * ONE_HUNDRED}%`;
    }

    if (!discountValue) {
        return '';
    }

    return `${labelBeforePrice}${discountValue}${labelAfterPrice}`;
};
