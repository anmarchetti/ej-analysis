import React, { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmountLeftToPay from 'frontend/components/renderings/Payment/components/AmountLeftToPay';
import PaymentOptions from 'frontend/components/renderings/Payment/components/PaymentOptions';
import { gaLoginSuccess } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { IPayBalancePageFields, IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import BillingAddressForm from './BillingAddressForm';
import PaymentErrors from './PaymentErrors';
import UseCredit from './UseCredit';
import UseCreditLogin from './UseCreditLogin';

export interface IPaymentFormProps {
    fields: IPaymentPageFields | IPayBalancePageFields | undefined;
    isAmendPayment?: boolean;
    isBillingOpen?: boolean;
    isDisabled?: boolean;
    onPaymentOptionSelected?: () => void;
    onSuccessLogin?: () => Promise<void>;
    rendering?: ISitecoreComponent['rendering'];
}

export const PaymentForm: FunctionComponent<IPaymentFormProps> = ({
    fields,
    isAmendPayment,
    isDisabled,
    onSuccessLogin,
    isBillingOpen,
    onPaymentOptionSelected,
    rendering,
}) => {
    const { amountToPay, amount, getPhrase, isUseCreditActive } = useStore((stores: TStores) => ({
        amountToPay: stores.payStore.amountToPay,
        usedCredit: stores.payStore.usedCredit,
        currency: stores.payStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        amount: stores.payStore.amount,
        getPhrase: stores.layoutStore.getPhrase,
        isUseCreditActive: stores.payStore.isUseCreditActive,
    }));

    const { pushTrackingEvent } = usePaymentTracking();

    // hide payment form at all if there is no amount for pay (might happen when other amount was selected in AmountForPay)
    if (amount <= 0) {
        return null;
    }

    const handleOnSuccessLogin: () => Promise<void> = async () => {
        pushTrackingEvent(gaLoginSuccess);
        await onSuccessLogin?.();
    };

    // payment form should be hidden if we plan to use credit or whole holiday amount will be paid with credit
    const isFormHidden = isUseCreditActive || amountToPay <= 0;
    const canMakePayment = (globalThis as Window & typeof globalThis).ApplePaySession?.canMakePayments();

    const amountLeftToPayLabel =
        isAmendPayment && canMakePayment ? fields?.AmountLeftToPayWithApplePayToggleOn : fields?.AmountLeftToPay;

    return (
        <div className='payment-form'>
            {!isAmendPayment && (
                <div className='row'>
                    <h2 className='payment-subtitle'>{getPhrase(SitecoreDictionary.PaymentTitlesPaymentDetails)}</h2>
                </div>
            )}

            <UseCredit fields={fields} isDisabled={isDisabled} rendering={rendering} />

            {isFormHidden && <PaymentErrors fields={fields} />}

            {!isFormHidden && (
                <>
                    <AmountLeftToPay amountLeftToPayField={amountLeftToPayLabel} />

                    <PaymentOptions
                        fields={fields}
                        isDisabled={isDisabled}
                        onPaymentOptionSelected={onPaymentOptionSelected}
                    />
                    {fields?.UseCreditLogInText?.value && (
                        <UseCreditLogin textField={fields.UseCreditLogInText} onSuccessLogin={handleOnSuccessLogin} />
                    )}
                    <BillingAddressForm isDisabled={isDisabled} isOpen={isBillingOpen} />
                </>
            )}
        </div>
    );
};

export default observer(PaymentForm);
