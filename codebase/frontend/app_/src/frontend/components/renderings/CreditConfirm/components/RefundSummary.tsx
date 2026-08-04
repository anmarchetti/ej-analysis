import React from 'react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import { IBookingRefund } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

export interface IRefundSummaryProps {
    currency: CurrencyCode | undefined;
    description: ISitecoreField<string>;
    isCreditOnlyRefund: boolean;
    isDisabled: boolean;
    isLoading: boolean;
    onConfirmClick: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    refund: IBookingRefund;
}

const RefundSummary = ({
    refund,
    currency,
    isCreditOnlyRefund,
    description,
    isDisabled,
    isLoading,
    onConfirmClick,
}: IRefundSummaryProps) => {
    const { getPhrase, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const title = getPhrase(
        isCreditOnlyRefund
            ? SitecoreDictionary.CreditConfirmRefundSummaryTotalCredit
            : SitecoreDictionary.CreditConfirmRefundSummaryTotalRefund,
    );

    const total = getTotalBookingRefund(isCreditOnlyRefund, refund);

    const renderBreakdown = (labelDictionary: string, value: number = 0) => (
        <div className='refund-summary__breakdown'>
            <span data-tid='refund-summary-breakdown-label'>{getPhrase(labelDictionary)}</span>
            <span className='refund-summary__breakdown-value'>
                {formatMoney(value, { currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger })}
            </span>
        </div>
    );

    return (
        <div className='refund-summary'>
            {!isCreditOnlyRefund && (
                <div className='refund-summary__breakdowns'>
                    {renderBreakdown(SitecoreDictionary.CreditConfirmRefundSummaryCashBreakdown, refund.refund.cash)}
                    {renderBreakdown(
                        SitecoreDictionary.CreditConfirmRefundSummaryCreditBreakdown,
                        refund.refund.credit,
                    )}
                </div>
            )}

            <div className='refund-summary__card'>
                <h2 className='refund-summary__title'>
                    <span data-tid='refund-summary-label'>{title}</span>
                    <span className='refund-summary__price' data-cs-mask>
                        {formatMoney(total, { currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger })}
                    </span>
                </h2>
                <div className='refund-summary__text'>
                    {!!description?.value && <RichTextWithLinks field={description} />}
                    <Button
                        type='submit'
                        isFullWidth
                        isLarge
                        onClick={onConfirmClick}
                        hasDisabledStyles={isDisabled}
                        isLoading={isLoading}
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsConfirm)}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RefundSummary;
