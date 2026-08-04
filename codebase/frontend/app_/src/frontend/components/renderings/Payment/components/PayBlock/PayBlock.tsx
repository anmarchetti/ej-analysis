import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SVGLockFilled from 'frontend/components/icons-new/LockFilled';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { ApplePayButton } from 'frontend/components/renderings/Payment/components/ApplePay/ApplePayButton';

import AmountToPay from './AmountToPay';
import { IPayBlockProps } from './interfaces';
import PriceBreakdown from './PriceBreakdown';

import styles from './PayBlock.module.scss';

export const PayBlock: FC<IPayBlockProps> = props => {
    const { isPaymentAllowed, currency, getPhrase, formatMoney, selectedPaymentType } = useStore((stores: TStores) => ({
        isPaymentAllowed: stores.payStore.isPaymentAllowed,
        currency: stores.payStore.currency,
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        selectedPaymentType: isTradeStore(stores) ? PaymentType.Card : stores.paymentTypeStore.selectedPaymentType,
    }));

    const {
        amountToPay,
        amount,
        onPay,
        canPay,
        usedCredit,
        amountLabel,
        fatalPaymentError,
        requirePaymentAuthorization,
        applePayPaymentFormValidation,
        applePayPaymentAuthorization,
    } = props;

    const canProceedWithFullCreditPayment = !!usedCredit && amountToPay !== undefined && amountToPay <= 0;

    const canProceedWithCardPayment =
        !canProceedWithFullCreditPayment &&
        !fatalPaymentError &&
        !requirePaymentAuthorization &&
        selectedPaymentType === PaymentType.Card;

    const canProceedWithApplePayPayment =
        !canProceedWithFullCreditPayment && selectedPaymentType === PaymentType.ApplePay;

    return (
        <div className={styles.holidaySummary} data-tid='pay-block-holiday-summary'>
            <div className={styles.content}>
                <PriceBreakdown
                    amount={amount}
                    usedCredit={usedCredit}
                    formatMoney={formatMoney}
                    currency={currency}
                    getPhrase={getPhrase}
                    amountLabel={amountLabel}
                />

                <div className={`${styles.contentItem} ${styles.totalPrice}`}>
                    <div
                        id='total-price-description'
                        className={styles.totalPriceDescription}
                        data-tid='total-price-description'
                    >
                        {getPhrase?.(SitecoreDictionary.PaymentTitlesYouAboutToPay)}
                    </div>
                    <AmountToPay amount={amountToPay} currency={currency} />
                </div>
            </div>

            {(canProceedWithCardPayment || canProceedWithFullCreditPayment) && (
                <Button
                    data-tid='pay-with-card'
                    isFullWidth
                    onClick={() => onPay()}
                    hasDisabledStyles={!canPay}
                    disabled={!isPaymentAllowed}
                    isLarge
                    className={styles.payNowButton}
                >
                    <SVGLockFilled />
                    {getPhrase(SitecoreDictionary.PaymentButtonsPayNow)}
                </Button>
            )}

            {canProceedWithApplePayPayment && (
                <ApplePayButton
                    amountToPay={amountToPay!}
                    formValidation={applePayPaymentFormValidation}
                    onPaymentAuthorised={applePayPaymentAuthorization}
                    className={styles.customApplePayButtonClass}
                    hasDisabledOverlay={!canPay}
                />
            )}

            {!isPaymentAllowed && (
                <ErrorMessage
                    icon={<SVGWarningFilled />}
                    message='This site is not secure, you cannot proceed with payment'
                    errorMessageClass='mt-3'
                />
            )}
        </div>
    );
};

export default observer(PayBlock);
