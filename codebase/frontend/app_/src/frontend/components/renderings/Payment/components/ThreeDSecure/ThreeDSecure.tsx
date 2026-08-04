import React, { PureComponent } from 'react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { envAll } from 'code/env';
import { logger } from 'frontend/services/logging';
import { getUrlOrigin } from 'frontend/utils/url.utils';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import { IPaymentAuthorizationCode } from 'models/enum/IPaymentAuthorizationCode';

import ChallengeShopper from './ChallengeShopper';
import IdentifyShopper from './IdentifyShopper';
import { ThreeDS1Frame } from './ThreeDS1Frame';

export interface IThreeDSecureProps {
    onPay: (threeDSData?: IThreeDSData) => void;
    paymentAuthorization: IPaymentAuthorization;
    onMounted?: () => void;
}

export class ThreeDSecure extends PureComponent<IThreeDSecureProps> {
    private ref = React.createRef<HTMLDivElement>();

    componentDidMount() {
        window.addEventListener('message', this.threeDSecureMessage);

        if (this.ref?.current) {
            scrollIntoViewIfNeeded(this.ref.current, { block: 'center', behavior: 'smooth' });
        }

        // Identify (fingerprint) is an invisible 0px iframe — keep the spinner active so the user
        // sees a continuous loading state until a visible step (Challenge or Redirect) mounts.
        // Challenge and Redirect render actual UI, so it's safe to clear the spinner then.
        if (this.props.paymentAuthorization.resultCode !== IPaymentAuthorizationCode.Identify) {
            this.props.onMounted?.();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.threeDSecureMessage);
    }

    private threeDSecureMessage = (e: any) => {
        let eventData = e.data;

        eventData?.payload &&
            logger.info(
                `3DS payload: ${JSON.stringify({
                    event: eventData.payload.event,
                    payloadLength: eventData.payload.payload?.length,
                })}`,
            );

        if (e.origin === getUrlOrigin(envAll.PAYMENT_ORIGIN) && eventData?.threeDSEventType) {
            logger.info(
                `3DS EventType: ${JSON.stringify({
                    threeDSEventType: eventData.threeDSEventType,
                    transStatus: eventData.transStatus,
                })}`,
            );

            if (window['changePaymentMessage']) {
                eventData = window['changePaymentMessage'](eventData);
            }

            this.doOnPay(eventData);
        }
    };

    private doOnPay = eventData => {
        eventData = {
            threeDSServerTransID: this.props.paymentAuthorization.threeDSServerTransID,
            transactionReference: this.props.paymentAuthorization.transactionReference,
            MD: this.props.paymentAuthorization.md,
            PaRes: this.props.paymentAuthorization.paReq,
            threeDSEventType: 'client',
            ...eventData,
        };

        this.props.onPay({
            bookingReference: this.props.paymentAuthorization.bookingReference,
            requestId: this.props.paymentAuthorization.requestId,
            sessionId: this.props.paymentAuthorization.sessionId,
            threeDSServerTransID: eventData.threeDSServerTransID,
            transactionReference: eventData.transactionReference,
            md: eventData.MD,
            paRes: eventData.PaRes,
            challengeComplete: this.props.paymentAuthorization.resultCode === IPaymentAuthorizationCode.Challenge,
            issuerUrl: this.props.paymentAuthorization.issuerUrl,
            transStatus: eventData.transStatus,
            threeDSEventType: eventData.threeDSEventType,
            // 3DS1 error
            authenticationError: !!eventData.authenticationError,
            // 3DS2 errors
            fingerprintError: !!eventData.fingerprintError,
            fingerprintTimeout: !!eventData.fingerprintTimeout,
            challengeError: !!eventData.challengeError,
        });
    };

    /**
     * 3DS1 authentication step technical error
     */
    private onAuthTechnicalError = () => {
        logger.error({ e: { name: '3DS', message: '3DS authentication Error' } });

        this.doOnPay({ authenticationError: true });
    };

    /**
     * 3DS2 fingerprint step technical error
     */
    private onFingerprintTechnicalError = () => {
        logger.error({ e: { name: '3DS', message: '3DS fingerprint Error' } });

        this.doOnPay({ fingerprintError: true });
    };

    /**
     * 3DS2 fingerprint timeout  error
     */
    private onFingerprintTimeoutError = () => {
        logger.error({ e: { name: '3DS', message: '3DS fingerprint Timeout' } });

        this.doOnPay({ fingerprintTimeout: true });
    };

    /**
     * 3DS2 challenge step technical error
     */
    private onChallengeTechnicalError = () => {
        logger.error({ e: { name: '3DS', message: '3DS challenge Error' } });

        this.doOnPay({ challengeError: true });
    };

    private get threeDSType() {
        switch (this.props.paymentAuthorization.resultCode) {
            case IPaymentAuthorizationCode.Identify:
                return (
                    <IdentifyShopper
                        {...this.props.paymentAuthorization}
                        onError={this.onFingerprintTechnicalError}
                        onTimeoutError={this.onFingerprintTimeoutError}
                    />
                );
            case IPaymentAuthorizationCode.Challenge:
                return (
                    <ChallengeShopper {...this.props.paymentAuthorization} onError={this.onChallengeTechnicalError} />
                );
            case IPaymentAuthorizationCode.Redirect:
                return <ThreeDS1Frame {...this.props.paymentAuthorization} onError={this.onAuthTechnicalError} />;
            default:
                return null;
        }
    }

    render() {
        return <div ref={this.ref}>{this.threeDSType}</div>;
    }
}

export default ThreeDSecure;
