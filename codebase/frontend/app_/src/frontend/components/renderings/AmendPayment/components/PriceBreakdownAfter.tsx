import React from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const PriceBreakdownAfter = () => {
    const { isRefund, newBalanceAmount, addToBalanceDueDate, currency, getPhrase, formatMoney } = useStore(
        (stores: IHolidaysStores) => ({
            isRefund: stores.amendPaymentStore.isRefund,
            newBalanceAmount: stores.amendPaymentStore.newBalanceAmount,
            addToBalanceDueDate: stores.amendPaymentStore.addToBalanceDueDate,
            currency: stores.amendPaymentStore.currency,

            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
        }),
    );

    if (isRefund || newBalanceAmount <= 0) {
        return null;
    }

    const date = formatDateL10n(addToBalanceDueDate, DATE_FORMATS.L);

    const remainingDuePhrase = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.BookingPaymentLabelsRemainingBalanceDueDate),
        Tokens.Date,
        `${date}`,
    );

    return (
        <>
            <div className='holiday-summary__content__item'>
                <span className='description'>
                    {getPhrase(SitecoreDictionary.BookingPaymentLabelsRemainingBalance)}
                    <br />
                    <span className='small'>{remainingDuePhrase}</span>
                </span>
                <span className='price'>
                    {formatMoney(newBalanceAmount, {
                        currency,
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                    })}
                </span>
            </div>
        </>
    );
};

export default observer(PriceBreakdownAfter);
