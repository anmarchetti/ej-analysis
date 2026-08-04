import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

export const dataTid = 'price-change-warning';

export interface IPriceChangedProps {
    className?: string;
    priceDecreasedMessage?: string;
    priceIncreasedMessage?: string;
}

export const PriceChanged = ({ priceIncreasedMessage, priceDecreasedMessage, className }: IPriceChangedProps) => {
    const { getPhrase, formatMoney, currency, actualPrice, previousPrice, isApplyingPromoCode } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.bookingStore.currency,
        actualPrice: stores.bookingStore.totalPrice,
        previousPrice: stores.bookingStore.previousPrice,
        isApplyingPromoCode: stores.bookingStore.applyingPromoCode,
    }));

    if (!actualPrice || !previousPrice || isApplyingPromoCode) {
        return null;
    }

    const delta = actualPrice - previousPrice;

    if (Math.abs(delta) <= 1) {
        return null;
    }

    const decreaseMessage =
        priceDecreasedMessage || getPhrase(SitecoreDictionary.GlobalsTitlesUpdatedPriceDescriptionDecrease);
    const increaseMessage =
        priceIncreasedMessage || getPhrase(SitecoreDictionary.GlobalsTitlesUpdatedPriceDescriptionIncrease);

    const message = delta > 0 ? increaseMessage : decreaseMessage;

    return (
        <ErrorMessage
            message={Tokenizer.replaceTokens(message, {
                [Tokens.Amount]: formatMoney(Math.abs(delta), {
                    currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                }),
                [Tokens.Newprice]: formatMoney(actualPrice, {
                    currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                }),
            })}
            icon={<SvgInfoFilled />}
            errorMessageClass={classNames('my-3 ', className)}
            IsNotification
            dataTid={dataTid}
        />
    );
};

export default observer(PriceChanged);
