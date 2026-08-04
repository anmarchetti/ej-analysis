import React from 'react';
import { observer } from 'mobx-react';
import Script from 'next/script';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import isBackend from 'frontend/utils/isBackend';
import { PaymentType } from 'models/enum/PaymentType';
import SiteSettings from 'models/enum/SiteSettings';

export const applePaySdkUrl = process.env.NEXT_PUBLIC_APPLEPAY_URL ?? '';

const ApplePayEnabler: React.FC = () => {
    const {
        setApplePayAvailable,
        setApplePayUnavailable,
        getSettingAsBoolean,
        setSelectedPaymentType,
        setPreferredPaymentType,
    } = useStore((stores: IHolidaysStores) => ({
        setApplePayAvailable: stores?.paymentTypeStore?.setApplePayAvailable,
        setApplePayUnavailable: stores?.paymentTypeStore?.setApplePayUnavailable,
        getSettingAsBoolean: stores?.layoutStore?.getSettingAsBoolean,
        setSelectedPaymentType: stores?.paymentTypeStore?.setSelectedPaymentType,
        setPreferredPaymentType: stores?.paymentTypeStore?.setPreferredPaymentType,
    }));

    const isApplePayEnabled: boolean = getSettingAsBoolean(SiteSettings.IsApplePayEnabled);

    if (!isApplePayEnabled) {
        setApplePayUnavailable();

        return null;
    }

    const handleScriptLoad = (): void => {
        if (!isBackend() && window?.ApplePaySession?.canMakePayments()) {
            setApplePayAvailable();

            if (isAppleMobile() || isSafari()) {
                setSelectedPaymentType(PaymentType.ApplePay);
                setPreferredPaymentType(PaymentType.ApplePay);
            }
        }
    };

    const isSafari = (): boolean => {
        const userAgent = navigator.userAgent;

        // Check for 'Safari' and 'AppleWebKit', and exclude 'Chrome', 'CriOS' (Chrome iOS), and 'FxiOS' (Firefox iOS)
        // This is not perfect but is a common pattern for *some* level of distinction.
        return (
            /Safari/i.test(userAgent) && /AppleWebKit/i.test(userAgent) && !/Chrome|CriOS|FxiOS|Edge/i.test(userAgent)
        );
    };

    const isAppleMobile = (): boolean => {
        const userAgent = navigator.userAgent;

        return /iP(ad|hone|od)/i.test(userAgent);
    };

    return (
        <Script
            src={applePaySdkUrl + '/v1.3.30/apple-pay-sdk.js'}
            integrity='sha384-7KJIkGT+8p0K2rhsEQcz7zZ+nYUFUbN573ZKSgwp9YKN7uUC+h5TAhEIdOAZgo6R'
            crossOrigin='anonymous'
            onLoad={handleScriptLoad}
        />
    );
};

export default observer(ApplePayEnabler);
