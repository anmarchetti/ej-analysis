import React from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import amendPayNowPricesStyles from './AmendPayNowPrices.module.scss';

export interface IAmendmentPayNowPricesProps {
    fields: IPaymentPageFields | undefined;
}

export function AmendmentPayNowPrices({ fields }: IAmendmentPayNowPricesProps) {
    const { totalPrice, balanceAmount, isRefund, currency, formatMoney } = useStore((stores: IHolidaysStores) => ({
        balanceAmount: stores.amendPaymentStore.balanceAmount,
        totalPrice: stores.amendPaymentStore.totalPrice,
        isRefund: stores.amendPaymentStore.isRefund,
        currency: stores.amendPaymentStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const textMeta = {
        prevBalance: fields?.PreviousBalanceLabel?.value,
        additionalPay: isRefund ? fields?.BalanceReduction?.value : fields?.AdditionalCost?.value,
    };

    const slots = [
        {
            name: textMeta.prevBalance,
            money: formatMoney(balanceAmount, { currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }),
        },
        {
            name: textMeta.additionalPay,
            money: formatMoney(totalPrice, { currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }),
        },
    ];

    return (
        <div className={amendPayNowPricesStyles.prices}>
            {slots.map(({ name, money }) => (
                <div className={amendPayNowPricesStyles.price} key={name}>
                    <p className={amendPayNowPricesStyles.name}>{name}</p>
                    <p className={amendPayNowPricesStyles.money}>{money}</p>
                </div>
            ))}
            <div className={amendPayNowPricesStyles.total}>
                <p className={amendPayNowPricesStyles.name}>{fields?.DueBalanceLessBlockDaysTotal?.value}</p>
                <p className={amendPayNowPricesStyles.money}>
                    {formatMoney(totalPrice + balanceAmount, {
                        currency,
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                    })}
                </p>
            </div>
        </div>
    );
}

export default observer(AmendmentPayNowPrices);
