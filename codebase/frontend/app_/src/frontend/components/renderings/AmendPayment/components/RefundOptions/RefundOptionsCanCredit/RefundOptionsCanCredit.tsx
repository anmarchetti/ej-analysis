import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import { IBookingRefund } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import PaymentOptionPrice from 'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionPrice/PaymentOptionPrice';
import { getCreditField } from 'frontend/components/renderings/AmendPayment/components/RefundOptions/refundOptions.utils';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import PaymentMethodCard from 'frontend/components/renderings/Payment/components/PaymentMethodCard';

interface IRefundOptionsCanCreditProps {
    fields: IPaymentPageFields | undefined;
}

const RefundOptionsCanCredit: FC<IRefundOptionsCanCreditProps> = ({ fields }) => {
    const { canRefund, canCredit, refundData, isCreditRefund, currency, setIsCreditRefund, getPhrase, formatMoney } =
        useStore((stores: IHolidaysStores) => ({
            canRefund: stores.amendPaymentStore.canRefund,
            canCredit: stores.amendPaymentStore.canCredit,
            refundData: stores.amendPaymentStore.refundData,
            isCreditRefund: stores.amendPaymentStore.isCreditRefund,
            currency: stores.amendPaymentStore.currency,
            setIsCreditRefund: stores.amendPaymentStore.setIsCreditRefund,
            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
        }));

    const creditField = getCreditField(
        fields?.CreditDescription?.value,
        formatMoney(refundData?.credit?.credit ?? 0, {
            currency,
        }),
    );

    const value = getTotalBookingRefund(true, refundData as IBookingRefund);
    const disabled = canCredit && !canRefund;

    return (
        <PaymentMethodCard
            checkboxId='credit-option'
            title={getPhrase(SitecoreDictionary.HolidayCreditTitlesHolidayCredit)}
            isSelected={isCreditRefund}
            onSelect={(): void => setIsCreditRefund(true)}
            isFullScreen={disabled}
            notSelectable={disabled}
        >
            {creditField && <RichTextWithLinks field={creditField} className='credit-description' />}
            <PaymentOptionPrice
                price={value}
                description={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsTotal)}
                isTotal
                currency={currency}
            />
        </PaymentMethodCard>
    );
};

export default observer(RefundOptionsCanCredit);
