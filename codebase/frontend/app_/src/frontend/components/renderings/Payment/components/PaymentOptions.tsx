import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PaymentType } from 'models/enum/PaymentType';
import ApplePayPaymentOption from 'frontend/components/renderings/Payment/components/ApplePayPaymentOption/ApplePayPaymentOption';
import CreditDebitCardPaymentOption from 'frontend/components/renderings/Payment/components/CreditDebitCardPaymentOptions/CreditDebitCardPaymentOption';
import { IPayBalancePageFields, IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';

import PaymentErrors from './PaymentErrors';

export interface IPaymentOptionsProps {
    fields: IPaymentPageFields | IPayBalancePageFields | undefined;
    isDisabled?: boolean;
    onPaymentOptionSelected?: () => void;
}

export const PaymentOptions: FC<IPaymentOptionsProps> = ({ fields, isDisabled, onPaymentOptionSelected }) => {
    const { paymentTypes, preferredPaymentType } = useStore((stores: IHolidaysStores) => ({
        paymentTypes: stores.paymentTypeStore.paymentTypes,
        preferredPaymentType: stores.paymentTypeStore.preferredPaymentType,
    }));

    return (
        <>
            {preferredPaymentType === PaymentType.ApplePay && paymentTypes.includes(PaymentType.ApplePay) && (
                <ApplePayPaymentOption onPaymentOptionSelected={onPaymentOptionSelected} />
            )}

            <CreditDebitCardPaymentOption fields={fields} isDisabled={isDisabled} />

            {preferredPaymentType !== PaymentType.ApplePay && paymentTypes.includes(PaymentType.ApplePay) && (
                <ApplePayPaymentOption onPaymentOptionSelected={onPaymentOptionSelected} />
            )}

            <PaymentErrors fields={fields} />
        </>
    );
};

export default observer(PaymentOptions);
