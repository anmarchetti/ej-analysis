import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IPaymentErrorsFields, IPaymentLabelsFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import styles from './amendPaymentMeta.module.scss';

export interface IAmendPaymentErrorPopupProps {
    fields: IPaymentErrorsFields & IPaymentLabelsFields;
    onClose: () => void;
}

const AmendPaymentErrorPopup = ({ fields, onClose }: IAmendPaymentErrorPopupProps) => {
    const { isAtcomError, getAmendTransportLabel } = useStore(({ payStore, amendPaymentStore }: IHolidaysStores) => ({
        isAtcomError: payStore.isAtcomError,
        getAmendTransportLabel: amendPaymentStore.getAmendTransportLabel,
    }));

    const { PaymentErrorDescription, PaymentErrorTitle, PaymentErrorCTA, PaymentAtcomErrorCTA } = fields;

    const description = getAmendTransportLabel(PaymentErrorDescription.value, fields);
    const ctaText = isAtcomError ? PaymentAtcomErrorCTA : PaymentErrorCTA;

    return (
        <FloatingPopup
            contentClass={styles.popup}
            onClose={onClose}
            footerContent={
                <Button onClick={onClose} isFullWidth aria-label={ctaText.value}>
                    {ctaText.value}
                </Button>
            }
        >
            <div>
                <Text field={PaymentErrorTitle} className={styles.title} tag='h4' />
                <RichTextWithLinks className={styles.description} field={{ value: description }} />
            </div>
        </FloatingPopup>
    );
};

export default observer(AmendPaymentErrorPopup);
