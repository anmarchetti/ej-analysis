import React, { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RadioButtonNew from 'frontend/components/common/RadioButtonNew/RadioButtonNew';
import ApplePayLogo from 'frontend/components/icons-new/ApplePayLogo';
import PaymentOptionWrapper from 'frontend/components/renderings/Payment/components/PaymentOptionWrapper/PaymentOptionWrapper';
import {
    gaApplePayDisplayedOnPage,
    gaApplePayPaymentOptionClicked,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import styles from './ApplePayPaymentOption.module.scss';

const ApplePayPaymentOption: FC<{ onPaymentOptionSelected?: () => void }> = ({ onPaymentOptionSelected }) => {
    const { getPhrase, selectedPaymentType, setSelectedPaymentType } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        selectedPaymentType: stores.paymentTypeStore.selectedPaymentType,
        setSelectedPaymentType: stores.paymentTypeStore.setSelectedPaymentType,
    }));

    const { pushTrackingEvent } = usePaymentTracking();

    const onApplePayPaymentTypeSelected = (): void => {
        if (selectedPaymentType !== PaymentType.ApplePay) {
            pushTrackingEvent(gaApplePayPaymentOptionClicked);
        }

        setSelectedPaymentType(PaymentType.ApplePay);
        onPaymentOptionSelected?.();
    };

    useEffect(() => {
        pushTrackingEvent(gaApplePayDisplayedOnPage);
    }, []);

    return (
        <PaymentOptionWrapper
            dataTid='apple-pay-payment-type-option'
            onSelect={onApplePayPaymentTypeSelected}
            clickable={true}
            variant='applePay'
        >
            <RadioButtonNew
                dataTid='apple-pay-payment-option-radio-button'
                label={getPhrase(SitecoreDictionary.PaymentLabelsApplePay)}
                checked={selectedPaymentType === PaymentType.ApplePay}
                labelClass={styles.radioLabel}
            />
            <ApplePayLogo data-tid='apple-pay-logo' className={styles.applePayLogo} />
        </PaymentOptionWrapper>
    );
};

export default observer(ApplePayPaymentOption);
