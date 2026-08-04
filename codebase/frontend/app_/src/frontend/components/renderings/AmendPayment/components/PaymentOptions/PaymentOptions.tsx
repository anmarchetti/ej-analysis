import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { PaymentOption } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import { gaClickPayAmend } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import PaymentOptionAddToBalance from './PaymentOptionAddToBalance/PaymentOptionAddToBalance';
import PaymentOptionsFull from './PaymentOptionsFull/PaymentOptionsFull';

interface IPaymentOptionsProps {
    fields: IPaymentPageFields | undefined;
}

const PaymentOptions: FC<IPaymentOptionsProps> = props => {
    const { fields } = props;

    const { pushTrackingEvent } = usePaymentTracking();

    const { paymentOption, totalPrice, onChangePaymentOption, canAddToBalance } = useStore(
        (stores: IHolidaysStores) => ({
            paymentOption: stores.amendPaymentStore.paymentOption,
            totalPrice: stores.amendPaymentStore.totalPrice,
            onChangePaymentOption: stores.amendPaymentStore.onChangePaymentOption,
            canAddToBalance: stores.amendPaymentStore.canAddToBalance,
        }),
    );

    const handlePaymentOption = (option: PaymentOption): void => {
        pushTrackingEvent(gaClickPayAmend(option));
        onChangePaymentOption(option);
    };

    if (!totalPrice) {
        return null;
    }

    return (
        <>
            <PaymentOptionsFull
                fields={fields}
                isSelected={paymentOption === PaymentOption.Part}
                onChange={(): void => handlePaymentOption(PaymentOption.Part)}
            />
            {canAddToBalance && (
                <PaymentOptionAddToBalance
                    fields={fields}
                    isSelected={paymentOption === PaymentOption.AddToBalance}
                    onChange={(): void => handlePaymentOption(PaymentOption.AddToBalance)}
                />
            )}
        </>
    );
};

export default observer(PaymentOptions);
