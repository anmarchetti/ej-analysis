import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import AmendmentPayNow from 'frontend/components/renderings/AmendPayment/components/AmendmentPayNow/AmendmentPayNow';
import PaymentOptions from 'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptions';
import PaymentOptionsFull from 'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionsFull/PaymentOptionsFull';
import RefundOptions from 'frontend/components/renderings/AmendPayment/components/RefundOptions/RefundOptions';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

export interface IAmendPaymentOptionsProps {
    fields: IPaymentPageFields;
}

const AmendPaymentOptions: FC<IAmendPaymentOptionsProps> = ({ fields }) => {
    const { isPayingFeesOnly, isBalanceDueDateExpired, isRefund, canCredit, canRefund, isOnlyRefundToBalance } =
        useStore((stores: IHolidaysStores) => ({
            isPayingFeesOnly: stores.amendPaymentStore.isPayingFeesOnly,
            isRefund: stores.amendPaymentStore.isRefund,
            canRefund: stores.amendPaymentStore.canRefund,
            canCredit: stores.amendPaymentStore.canCredit,
            isOnlyRefundToBalance: stores.amendPaymentStore.isOnlyRefundToBalance,
            isBalanceDueDateExpired: stores.amendPaymentStore.isBalanceDueDateExpired,
        }));

    if (isPayingFeesOnly) {
        return <PaymentOptionsFull fields={fields} isSelected />;
    }

    const isRefunding = (canCredit || canRefund || isOnlyRefundToBalance) && isRefund;

    if (isRefunding) {
        return <RefundOptions fields={fields} />;
    }

    if (isBalanceDueDateExpired) {
        return <AmendmentPayNow fields={fields} />;
    }

    return <PaymentOptions fields={fields} />;
};

export default observer(AmendPaymentOptions);
