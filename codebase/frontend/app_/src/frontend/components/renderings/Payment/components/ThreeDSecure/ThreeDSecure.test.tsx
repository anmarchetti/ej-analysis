import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { IPaymentAuthorizationCode } from 'models/enum/IPaymentAuthorizationCode';

import ThreeDSecure from './ThreeDSecure';

jest.mock('frontend/services/logging');

jest.mock('scroll-into-view-if-needed', () => jest.fn());

jest.mock('./IdentifyShopper', () => ({
    __esModule: true,
    default: () => <div data-tid='identify-shopper' />,
}));

jest.mock('./ChallengeShopper', () => ({
    __esModule: true,
    default: () => <div data-tid='challenge-shopper' />,
}));

jest.mock('./ThreeDS1Frame', () => ({
    __esModule: true,
    ThreeDS1Frame: () => <div data-tid='three-ds1' />,
}));

jest.mock('code/env', () => ({
    envPublic: {
        WEBAPI_URL: 'https://api.example.com',
        CMS_URL: 'https://cms.example.com',
        MEDIA_URL: 'https://media.example.com',
    },
    envAll: { PAYMENT_ORIGIN: 'https://pay.example.com' },
}));

const createAuth = (overrides: Partial<any> = {}) => ({
    resultCode: IPaymentAuthorizationCode.Redirect,
    threeDSServerTransID: 'server-id-from-auth',
    transactionReference: 'txn-ref',
    md: 'md-from-auth',
    paReq: 'pares-from-auth',
    issuerUrl: 'issuerUrl',
    bookingReference: 'bookingReference',
    sessionId: 'sessionId',
    requestId: 'requestId',
    acsTransID: 'acs-trans-id',
    acsURL: 'https://acs.example.com',
    messageVersion: '2.1.0',
    methodNotificationURL: 'https://notification.example.com',
    creq: 'creq-value',
    threeDSMethodData: 'threeDSMethodData-value',
    termUrl: 'https://termurl.example.com',
    threeDSMethodURL: 'https://threedsmethodurl.example.com',
    ...overrides,
});

describe('ThreeDSecure', () => {
    it('should render IdentifyShopper component', () => {
        render(
            <ThreeDSecure
                onPay={jest.fn()}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Identify })}
            />,
        );

        expect(screen.getByTestId('identify-shopper')).toBeInTheDocument();
    });

    it('should render ChallengeShopper component', () => {
        render(
            <ThreeDSecure
                onPay={jest.fn()}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Challenge })}
            />,
        );

        expect(screen.getByTestId('challenge-shopper')).toBeInTheDocument();
    });

    it('should render ThreeDS1Frame component', () => {
        render(
            <ThreeDSecure
                onPay={jest.fn()}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Redirect })}
            />,
        );

        expect(screen.getByTestId('three-ds1')).toBeInTheDocument();
    });

    it('should render empty wrapper when resultCode is invalid', () => {
        const { container } = render(
            <ThreeDSecure onPay={jest.fn()} paymentAuthorization={createAuth({ resultCode: null })} />,
        );

        const wrapper = container.firstElementChild as HTMLElement;

        expect(wrapper?.tagName).toBe('DIV');
        expect(wrapper?.childElementCount).toBe(0);
    });

    it('should call onMounted for Challenge resultCode', () => {
        const onMounted = jest.fn();

        render(
            <ThreeDSecure
                onPay={jest.fn()}
                onMounted={onMounted}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Challenge })}
            />,
        );

        expect(onMounted).toHaveBeenCalledTimes(1);
    });

    it('should call onMounted for Redirect resultCode', () => {
        const onMounted = jest.fn();

        render(
            <ThreeDSecure
                onPay={jest.fn()}
                onMounted={onMounted}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Redirect })}
            />,
        );

        expect(onMounted).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onMounted for Identify resultCode (invisible fingerprint step)', () => {
        const onMounted = jest.fn();

        render(
            <ThreeDSecure
                onPay={jest.fn()}
                onMounted={onMounted}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Identify })}
            />,
        );

        expect(onMounted).not.toHaveBeenCalled();
    });

    it('should add and remove the window message listener', () => {
        const addSpy = jest.spyOn(window, 'addEventListener');
        const removeSpy = jest.spyOn(window, 'removeEventListener');

        const { unmount } = render(
            <ThreeDSecure
                onPay={jest.fn()}
                paymentAuthorization={createAuth({ resultCode: IPaymentAuthorizationCode.Redirect })}
            />,
        );

        expect(addSpy).toHaveBeenCalledWith('message', expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should call onPay with mapped fields when receiving a valid 3DS message', () => {
        const onPay = jest.fn();

        render(
            <ThreeDSecure
                onPay={onPay}
                paymentAuthorization={createAuth({
                    resultCode: IPaymentAuthorizationCode.Redirect,
                    issuerUrl: 'issuerUrl',
                })}
            />,
        );

        // Simulate postMessage from the allowed origin
        const messageData = {
            threeDSEventType: '3ds',
            threeDSServerTransID: 'ThreeDSServerTransID',
            MD: 'MD',
            PaRes: 'PaRes',
            issuerUrl: 'issuerUrl',
            transStatus: 'Y',
        };

        window.dispatchEvent(new MessageEvent('message', { origin: 'https://pay.example.com', data: messageData }));

        expect(onPay).toHaveBeenCalledWith(
            expect.objectContaining({
                threeDSEventType: '3ds',
                transStatus: 'Y',
                threeDSServerTransID: 'ThreeDSServerTransID',
                md: 'MD',
                paRes: 'PaRes',
                issuerUrl: 'issuerUrl',
                bookingReference: 'bookingReference',
                sessionId: 'sessionId',
                requestId: 'requestId',
                challengeComplete: false,
                authenticationError: false,
                challengeError: false,
                fingerprintError: false,
                fingerprintTimeout: false,
            }),
        );
    });

    it('should call onPay with error flags when present in the message', () => {
        const onPay = jest.fn();

        render(
            <ThreeDSecure
                onPay={onPay}
                paymentAuthorization={createAuth({
                    resultCode: IPaymentAuthorizationCode.Redirect,
                })}
            />,
        );

        const messageData = {
            threeDSEventType: '3ds',
            transStatus: 'Y',
            threeDSServerTransID: 'ThreeDSServerTransID',
            MD: 'MD',
            PaRes: 'PaRes',
            issuerUrl: 'issuerUrl',
            authenticationError: true,
            challengeError: true,
            fingerprintError: true,
            fingerprintTimeout: true,
        };

        window.dispatchEvent(new MessageEvent('message', { origin: 'https://pay.example.com', data: messageData }));

        expect(onPay).toHaveBeenCalledWith(
            expect.objectContaining({
                threeDSEventType: '3ds',
                transStatus: 'Y',
                threeDSServerTransID: 'ThreeDSServerTransID',
                md: 'MD',
                paRes: 'PaRes',
                issuerUrl: 'issuerUrl',
                bookingReference: 'bookingReference',
                sessionId: 'sessionId',
                requestId: 'requestId',
                challengeComplete: false,
                authenticationError: true,
                challengeError: true,
                fingerprintError: true,
                fingerprintTimeout: true,
            }),
        );
    });
});
