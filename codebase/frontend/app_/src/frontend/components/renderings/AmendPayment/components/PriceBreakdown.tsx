import React from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

function PriceBreakdown() {
    const { isRefund, isCreditRefund, refundData, balanceAmount, currency, getPhrase, formatMoney } = useStore(
        (stores: IHolidaysStores) => ({
            isRefund: stores.amendPaymentStore.isRefund,
            isCreditRefund: stores.amendPaymentStore.isCreditRefund,
            refundData: stores.amendPaymentStore.refundData,
            balanceAmount: stores.amendPaymentStore.balanceAmount,
            currency: stores.amendPaymentStore.currency,

            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
        }),
    );

    if (isRefund) {
        if (balanceAmount > 0) {
            return null;
        }

        if (isCreditRefund) {
            return (
                <div className='holiday-summary__content__item'>
                    <span className='description'>
                        {getPhrase(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount).replace(/\…/g, '')}
                    </span>
                    <span className='price'>
                        {formatMoney(refundData?.credit?.credit ?? 0, {
                            currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
            );
        }

        return (
            <>
                <div className='holiday-summary__content__item'>
                    <span className='description'>
                        {getPhrase(SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount).replace(/\…/g, '')}
                    </span>
                    <span className='price'>
                        {formatMoney(refundData?.refund?.cash ?? 0, {
                            currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
                <div className='holiday-summary__content__item'>
                    <span className='description'>
                        {getPhrase(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount).replace(/\…/g, '')}
                    </span>
                    <span className='price'>
                        {formatMoney(refundData?.refund?.credit ?? 0, {
                            currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
            </>
        );
    }

    return null;
}

export default observer(PriceBreakdown);
