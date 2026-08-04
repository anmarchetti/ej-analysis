import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import applePayService from 'frontend/services/applePayService/applePay.service';
import { logger } from 'frontend/services/logging';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { PaymentType } from 'models/enum/PaymentType';
import ApplePayError from 'frontend/components/renderings/Payment/components/ApplePay/ApplePayError/ApplePayError';
import {
    gaApplePayButtonClicked,
    gaApplePayPaymentCancelled,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import styles from './ApplePayButton.module.scss';

interface IApplePayButtonProps {
    amountToPay: number;
    onPaymentAuthorised: (
        event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ) => Promise<ICommitBookingRequestBody | void>;
    className?: string;
    formValidation?: () => boolean;
    hasDisabledOverlay?: boolean;
    redirect?: (bookingBody: ICommitBookingRequestBody | void) => void;
}

const APPLE_PAY_SESSION_VERSION = 4;

export const ApplePayButton: React.FunctionComponent<IApplePayButtonProps> = props => {
    const { amountToPay, formValidation, onPaymentAuthorised, redirect, className, hasDisabledOverlay } = props;

    const applePayButtonRef = useRef<HTMLElement | null>(null);

    const { setSelectedPaymentType, currency, setMerchantValidationFailure } = useStore((stores: IHolidaysStores) => ({
        setSelectedPaymentType: stores.paymentTypeStore.setSelectedPaymentType,
        currency: stores.payStore.currency,
        setMerchantValidationFailure: stores.payStore.setMerchantValidationFailure,
    }));

    const { pushTrackingEvent } = usePaymentTracking();

    useEffect(() => {
        const currentApplePayButtonRef = applePayButtonRef.current;

        const handleGaApplePayButtonClickedEvent = (): void => {
            pushTrackingEvent(gaApplePayButtonClicked);
        };

        const startApplePaySession: any = () => {
            const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
                countryCode: 'GB',
                currencyCode: currency || 'GBP',
                supportedNetworks: ['visa', 'masterCard', 'amex', 'maestro'],
                merchantCapabilities: ['supports3DS'],
                total: { label: 'easyJet Holidays', amount: amountToPay.toString() },
            };

            const applePaySession = new ApplePaySession(APPLE_PAY_SESSION_VERSION, paymentRequest);

            const handleMerchantValidation = async (event: ApplePayJS.ApplePayValidateMerchantEvent): Promise<void> => {
                try {
                    const merchantSession = await applePayService.validateMerchant(event.validationURL);
                    applePaySession.completeMerchantValidation(merchantSession);
                } catch (error) {
                    logger.error({ e: error, message: 'Failed to validate Apple Pay merchant' });
                    applePaySession.abort?.();
                    setMerchantValidationFailure(error);
                }
            };

            const handleOnPaymentAuthorized = async (
                event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
            ): Promise<void> => {
                try {
                    const bookingBody = await onPaymentAuthorised(event);
                    applePaySession.completePayment({ status: ApplePaySession.STATUS_SUCCESS });

                    if (redirect) {
                        redirect(bookingBody);
                    }
                } catch (error) {
                    logger.error({ e: error, message: 'Payment authorization failed' });
                    applePaySession.completePayment({ status: ApplePaySession.STATUS_FAILURE });
                }
            };

            applePaySession.onvalidatemerchant = (event: ApplePayJS.ApplePayValidateMerchantEvent): void => {
                void handleMerchantValidation(event);
            };

            applePaySession.onpaymentauthorized = (event: ApplePayJS.ApplePayPaymentAuthorizedEvent): void => {
                void handleOnPaymentAuthorized(event);
            };

            applePaySession.oncancel = (): void => {
                pushTrackingEvent(gaApplePayPaymentCancelled);
            };

            applePaySession.begin();
        };

        const handleClick = (): void => {
            setSelectedPaymentType(PaymentType.ApplePay);

            if (formValidation && !formValidation()) {
                return;
            }

            startApplePaySession();
        };

        if (currentApplePayButtonRef) {
            currentApplePayButtonRef.addEventListener('click', handleGaApplePayButtonClickedEvent);
            currentApplePayButtonRef.addEventListener('click', handleClick);
        }

        return () => {
            if (currentApplePayButtonRef) {
                currentApplePayButtonRef.removeEventListener('click', handleGaApplePayButtonClickedEvent);
                currentApplePayButtonRef.removeEventListener('click', handleClick);
            }
        };
    }, [
        amountToPay,
        currency,
        onPaymentAuthorised,
        redirect,
        pushTrackingEvent,
        setSelectedPaymentType,
        formValidation,
        setMerchantValidationFailure,
    ]);

    return (
        <div data-tid='apple-pay-button-component' className={classNames(styles.applePayButtonContainer, className)}>
            <div
                className={hasDisabledOverlay ? styles.applePayButtonDisabled : styles.applePayButtonEnabled}
                data-tid='apple-pay-button'
            >
                <apple-pay-button ref={applePayButtonRef} buttonstyle='black' type='plain' locale='en-GB' />
            </div>
            <ApplePayError />
        </div>
    );
};

export default observer(ApplePayButton);
