import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './amendSummaryErrors.module.scss';

function AmendPaymentSummaryErrors() {
    const { isPaymentAllowed, paymentErrors, getPhrase } = useStore((stores: IHolidaysStores) => ({
        isPaymentAllowed: stores.payStore.isPaymentAllowed,
        getPhrase: stores.layoutStore.getPhrase,
        canPay: stores.amendPaymentStore.canPay,
        onPay: stores.amendPaymentStore.onPay,
        paymentErrors: stores.payStore.paymentErrors,
    }));

    return (
        <div className={styles.errors}>
            {!isPaymentAllowed && (
                <ErrorMessage
                    icon={<SVGWarningFilled />}
                    message={'This site is not secure, you cannot proceed with payment'}
                    errorMessageClass='mt-3'
                    isTransparent
                />
            )}
            {/*Edge case when we got an unknown error*/}
            {!!paymentErrors[0] && (
                <ErrorMessage
                    icon={<SVGWarningFilled />}
                    description={<RichTextDictionary dictionaryKey={paymentErrors[0].descriptionKey} />}
                    message={paymentErrors[0].messageKey && getPhrase(paymentErrors[0].messageKey)}
                    isTransparent
                />
            )}
        </div>
    );
}

export default observer(AmendPaymentSummaryErrors);
