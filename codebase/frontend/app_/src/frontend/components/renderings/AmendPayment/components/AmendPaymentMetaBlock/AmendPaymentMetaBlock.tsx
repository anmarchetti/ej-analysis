import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { PaymentOption } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import AmendPaymentTotalBlock from 'frontend/components/common/Amend/AmendPaymentTotalBlock/AmendPaymentTotalBlock';
import styles from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMeta.module.scss';
import { getPaymentSummaryMeta } from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock.utils';
import AmendPaymentTermsAndConditions from 'frontend/components/renderings/AmendPayment/components/AmendPaymentTermsAndConditions/AmendPaymentTermsAndConditions';
import ApplePayEnabler from 'frontend/components/renderings/Payment/components/ApplePay/ApplePayEnabler';
import PaymentForm from 'frontend/components/renderings/Payment/components/PaymentForm';
import PaymentProtected from 'frontend/components/renderings/Payment/components/PaymentProtected';
import ThreeDSecure from 'frontend/components/renderings/Payment/components/ThreeDSecure/ThreeDSecure';
import { IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import AmendPaymentSummaryErrors from './AmendPaymentSummaryErrors/AmendPaymentSummaryErrors';
import { IAmendPaymentMetaBlockProps } from './interfaces';

const AmendPaymentMetaBlock: FC<IAmendPaymentMetaBlockProps> = ({ fields }) => {
    const {
        requirePaymentAuthorization,
        paymentAuthorization,
        fatalPaymentError,
        onPay,
        amount,
        totalPrice,
        balanceAmount,
        usedCredit,
        amountToPay,
        paymentOption,
        isRefund,
        totalFeesAmount,
        newBalanceAmount,
        formValidation,
        commitBookingWithApplePay,
    } = useStore((stores: IHolidaysStores) => ({
        requirePaymentAuthorization: stores.payStore.requirePaymentAuthorization,
        paymentAuthorization: stores.payStore.paymentAuthorization,
        fatalPaymentError: stores.payStore.fatalPaymentError,
        onPay: stores.amendPaymentStore.onPay,
        amount: stores.payStore.amount,
        totalPrice: stores.amendPaymentStore.totalPrice,
        balanceAmount: stores.amendPaymentStore.balanceAmount,
        usedCredit: stores.payStore.usedCredit,
        amountToPay: stores.payStore.amountToPay,
        paymentOption: stores.amendPaymentStore.paymentOption,
        isRefund: stores.amendPaymentStore.isRefund,
        totalFeesAmount: stores.amendPaymentStore.amendmentPaymentInfo?.totalFeesAmount,
        newBalanceAmount: stores.amendPaymentStore.newBalanceAmount,
        getSettingAsBoolean: stores?.layoutStore?.getSettingAsBoolean,
        formValidation: stores.amendPaymentStore.formValidation,
        commitBookingWithApplePay: stores.amendPaymentStore.onPayWithApplePay,
    }));

    const { pushTrackingEvent } = usePaymentTracking();

    const handlePay = (threeDSData: IThreeDSData): void => {
        onPay(threeDSData, false, pushTrackingEvent);
    };

    const onPayWithApplePay = (applePayPaymentAuthorizedEvent: ApplePayJS.ApplePayPaymentAuthorizedEvent): void => {
        commitBookingWithApplePay(applePayPaymentAuthorizedEvent, pushTrackingEvent);
    };

    const isPaymentAuthorizationActive = requirePaymentAuthorization && !!paymentAuthorization;

    const { title, subtitle, price, shouldPayNow, confirmCTA, isFullCreditPayment } = getPaymentSummaryMeta({
        newBalanceAmount,
        totalFeesAmount,
        totalPrice,
        hasBalance: balanceAmount > 0,
        usedCredit,
        amountToPay,
        fields,
        paymentOption,
    });

    const isCardPaymentChosen =
        paymentOption === PaymentOption.Part || paymentOption === PaymentOption.Full || shouldPayNow;

    const customerIsNotPayingNow = !isCardPaymentChosen || isRefund;

    const hasError = fatalPaymentError || requirePaymentAuthorization;

    const isShowPaymentError = !hasError && customerIsNotPayingNow;

    const validateFormAndScrollToError = (): boolean => {
        const isValid = formValidation(pushTrackingEvent);

        if (!isValid) {
            scrollToErrorBlock();
        }

        return isValid;
    };

    return (
        <div className={classNames('wrapper--solid', styles.container)} data-tid='amend-payment-meta-block'>
            <div className='wrapper-container wrapper-container--px'>
                <ApplePayEnabler />
                <PaymentForm
                    fields={fields as unknown as IPaymentPageFields}
                    isDisabled={isPaymentAuthorizationActive}
                    isAmendPayment
                />
                {isPaymentAuthorizationActive && (
                    <ThreeDSecure paymentAuthorization={paymentAuthorization} onPay={handlePay} />
                )}
                {!!fields?.ProtectionTitle?.value && amount > 0 && (
                    <PaymentProtected
                        protectionImage={fields.ProtectionImage}
                        protectionTitle={fields.ProtectionTitle}
                    />
                )}
                <AmendPaymentTermsAndConditions fields={fields} />
                {isShowPaymentError && <AmendPaymentSummaryErrors />}
                <AmendPaymentTotalBlock
                    updatedBalanceAmount={newBalanceAmount}
                    hasError={hasError}
                    title={title}
                    subtitle={subtitle}
                    price={price}
                    confirmLabel={confirmCTA ?? fields?.ConfirmChangesLabel?.value}
                    isFullCreditPayment={isFullCreditPayment}
                    validateFormAndScrollToError={validateFormAndScrollToError}
                    onPayWithApplePay={onPayWithApplePay}
                    shouldPayNow={!!shouldPayNow}
                />
            </div>
        </div>
    );
};

export default observer(AmendPaymentMetaBlock);
