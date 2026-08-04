import { CurrencyCode, ICurrencyFormatOptions } from 'code/currency';
import { Tokens } from 'code/tokens';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISinglePromotionInfo } from 'models/data/IPromocode';

export const getCardDescription = ({
    promotion,
    currency,
    formatMoney,
    labelBeforePrice,
    labelAfterPrice,
}: {
    currency: CurrencyCode;
    formatMoney: (amount: number, options?: ICurrencyFormatOptions) => string;
    labelAfterPrice: string;
    labelBeforePrice: string;
    promotion?: ISinglePromotionInfo;
}): string | undefined => {
    if (!promotion?.cardDescription) {
        return promotion?.cardDescription;
    }

    let description = promotion.cardDescription;

    if (promotion.discountAmountPerBooking || promotion.percentageDiscountPerBooking) {
        description = Tokenizer.replaceToken(
            description,
            Tokens.Discount,
            getDiscount(promotion, currency, formatMoney),
        );
    }

    if (promotion.discountAmountPerPerson || promotion.discountPercentagePerPerson) {
        description = Tokenizer.replaceToken(
            description,
            Tokens.DiscountPerPerson,
            getDiscountPerPerson(promotion, currency, formatMoney, labelBeforePrice, labelAfterPrice),
        );
    }

    return description;
};
