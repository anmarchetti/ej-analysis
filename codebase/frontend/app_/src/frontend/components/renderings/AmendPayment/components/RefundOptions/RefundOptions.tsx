import { FC } from 'react';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PaymentBaseOption from 'frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption';
import PaymentOptionBreakdown from 'frontend/components/common/PriceOptions/PaymentOptionBreakdown/PaymentOptionBreakdown';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import AmendPaymentPriceDivider from 'frontend/components/renderings/AmendPayment/components/AmendPaymentPriceDivider/AmendPaymentPriceDivider';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import { getCreditField, getRefundField } from './refundOptions.utils';

import styles from './RefundOptions.module.scss';

interface IAmendRefundOptionsProps {
    fields: IPaymentPageFields | undefined;
}

const RefundOptions: FC<IAmendRefundOptionsProps> = ({ fields }) => {
    const {
        canRefund,
        canCredit,
        refundData,
        isCreditRefund,
        currency,
        setIsCreditRefund,
        getPhrase,
        getAmendTransportLabel,
        formatMoney,
        isOnlyRefundToBalance,
        totalPrice,
        balanceAmount,
    } = useStore((stores: IHolidaysStores) => ({
        canRefund: stores.amendPaymentStore.canRefund,
        canCredit: stores.amendPaymentStore.canCredit,
        refundData: stores.amendPaymentStore.refundData,
        isOnlyCreditRefund: stores.amendPaymentStore.isOnlyCreditRefund,
        isCreditRefund: stores.amendPaymentStore.isCreditRefund,
        currency: stores.amendPaymentStore.currency,
        setIsCreditRefund: stores.amendPaymentStore.setIsCreditRefund,
        getAmendTransportLabel: stores.amendPaymentStore.getAmendTransportLabel,
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        isOnlyRefundToBalance: stores.amendPaymentStore.isOnlyRefundToBalance,
        totalPrice: stores.amendPaymentStore.totalPrice,
        balanceAmount: stores.amendPaymentStore.balanceAmount,
    }));

    if (!fields) {
        return null;
    }

    const canShowCreditOption = canCredit && refundData;
    const canShowInitialPaymentOption = canRefund && refundData;

    const currencyOptions: ICurrencyFormatOptions = {
        currency,
    };
    const transportLabel = getAmendTransportLabel(fields?.RefundDescription?.value, fields);
    const refundField = getRefundField(transportLabel, amount => formatMoney(amount, currencyOptions), refundData);
    const creditField = getCreditField(
        fields?.CreditDescription?.value,
        formatMoney(refundData?.credit?.credit ?? 0, currencyOptions),
    );
    const refundCreditsPrice = getTotalBookingRefund(true, refundData);
    const refundPrice = getTotalBookingRefund(false, refundData);
    const balanceOptionPrice = (totalPrice ?? 0) + balanceAmount;
    const totalPricePhrase = getPhrase(SitecoreDictionary.CreditConfirmRefundCardsTotal);
    const nonCreditRefundOptionTitle = fields?.NonCreditRefundOptionTitle?.value || '';
    const creditRefundOptionTitle = fields?.CreditRefundOptionTitle?.value || '';
    const refundToBalanceOptionTitle = fields?.RefundToBalanceOptionTitle?.value || '';
    const previousBalanceLabel = fields?.PreviousBalanceLabel?.value || '';
    const totalCostOfChangeLabel = fields?.TotalCostOfChange?.value || '';
    const updatedHolidayBalanceLabel = fields?.UpdatedHolidayBalanceLabel?.value || '';

    return (
        <div className={styles.sizeContainer} data-tid='refund-options'>
            <div className={styles.paymentMethods}>
                {isOnlyRefundToBalance && ( //add to balance
                    <PaymentBaseOption
                        isSelected
                        checkboxId='balance-option'
                        title={refundToBalanceOptionTitle}
                        price={balanceOptionPrice}
                        priceDescription={updatedHolidayBalanceLabel}
                        className={styles.balanceRefund}
                        currency={currency}
                    >
                        {creditField && (
                            <RichTextWithLinks
                                field={fields.RefundToBalanceOptionDescription}
                                className='balance-option-description'
                            />
                        )}
                        <AmendPaymentPriceDivider />
                        <div className={styles.breakdowns}>
                            <PaymentOptionBreakdown
                                label={previousBalanceLabel}
                                value={balanceAmount}
                                className={styles.option}
                                dataTid='payment-option-breakdown-balance'
                                currency={currency}
                            />
                            <PaymentOptionBreakdown
                                label={totalCostOfChangeLabel}
                                value={totalPrice}
                                className={styles.option}
                                dataTid='payment-option-breakdown-total'
                                currency={currency}
                            />
                        </div>
                    </PaymentBaseOption>
                )}
                {canShowCreditOption && ( //create balance
                    <PaymentBaseOption
                        checkboxId='credit-option'
                        title={creditRefundOptionTitle}
                        isSelected={isCreditRefund}
                        onChange={(): void => setIsCreditRefund(true)}
                        disabled={canCredit && !canRefund}
                        price={refundCreditsPrice}
                        priceDescription={totalPricePhrase}
                        currency={currency}
                    >
                        {creditField && <RichTextWithLinks field={creditField} className='credit-description' />}
                    </PaymentBaseOption>
                )}

                {canShowInitialPaymentOption && (
                    <PaymentBaseOption
                        checkboxId='refund-option'
                        title={nonCreditRefundOptionTitle}
                        isSelected={!isCreditRefund}
                        onChange={(): void => setIsCreditRefund(false)}
                        price={refundPrice}
                        priceDescription={totalPricePhrase}
                        currency={currency}
                    >
                        {refundField && <RichTextWithLinks field={refundField} className='refund-description' />}
                        {!!refundData.refund.credit && (
                            <div className={styles.breakdowns}>
                                <PaymentOptionBreakdown
                                    label={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount)}
                                    value={refundData.refund.credit}
                                    className={styles.option}
                                    dataTid='payment-option-breakdown-refund-credit'
                                    currency={currency}
                                />
                                <PaymentOptionBreakdown
                                    label={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount)}
                                    value={refundData.refund.cash}
                                    className={styles.option}
                                    dataTid='payment-option-breakdown-refund-cash'
                                    currency={currency}
                                />
                            </div>
                        )}
                    </PaymentBaseOption>
                )}
            </div>
        </div>
    );
};

export default observer(RefundOptions);
