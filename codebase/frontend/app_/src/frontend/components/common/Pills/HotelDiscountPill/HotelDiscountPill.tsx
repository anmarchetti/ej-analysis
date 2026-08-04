import { FC } from 'react';

import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface IHotelDiscountPillProps {
    amount: number | undefined;
    countryCode: string;
    currency: CurrencyCode | undefined;
    className?: string;
    isSmall?: boolean;
    tooltipMessage?: string;
}

export const HotelDiscountPill: FC<IHotelDiscountPillProps> = props => {
    const { getPhrase, formatMoney, isPillVisible } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPillVisible: stores.layoutStore.isPillVisible,
        formatMoney: stores.marketStore.formatMoney,
    }));

    if (!props.amount || !isPillVisible(SiteSettings.DiscountPill, props.countryCode)) {
        return null;
    }

    return (
        <PricePill isRed isSmall={props.isSmall} tooltipMessage={props.tooltipMessage} className={props.className}>
            {Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.BasketLabelDiscount), {
                [Tokens.Amount]: formatMoney(props.amount, {
                    currency: props.currency,
                    maximumFractionDigits: 0,
                }),
            })}
        </PricePill>
    );
};

export default HotelDiscountPill;
