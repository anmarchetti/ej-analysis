import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PaymentType } from 'models/enum/PaymentType';
import SiteSettings from 'models/enum/SiteSettings';

import ApplePayEnabler from './ApplePayEnabler';

jest.mock('next/script', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');

    const ScriptMock: React.FC<any> = ({ onLoad, onReady }) => {
        React.useEffect(() => {
            onLoad?.();
            onReady?.();
        }, [onLoad, onReady]);

        return <div data-tid='apple-pay-sdk' />;
    };

    return {
        __esModule: true,
        default: ScriptMock,
    };
});

jest.mock('frontend/services/applePayService/applePay.service');

const constructorSpy = jest.fn();
const canMakePaymentsMock = jest.fn().mockReturnValue(true); // Simulate availability

class ApplePaySessionMock {
    constructor(version: number, paymentRequest: object) {
        constructorSpy({ version, paymentRequest });
        (global as any).__lastApplePaySession__ = this;
    }

    completeMerchantValidation = (session: any) => {
        throw new Error('completeMerchantValidation', session);
    };

    static canMakePayments = () => canMakePaymentsMock();
}

global.window.ApplePaySession = ApplePaySessionMock;

const setApplePayAvailable = jest.fn();
const setApplePayUnavailable = jest.fn();
const setSelectedPaymentType = jest.fn();
const setPreferredPaymentType = jest.fn();

const createStore = () =>
    createMockStores({
        paymentTypeStore: {
            setApplePayAvailable: setApplePayAvailable,
            setApplePayUnavailable: setApplePayUnavailable,
            setSelectedPaymentType: setSelectedPaymentType,
            setPreferredPaymentType: setPreferredPaymentType,
            selectedPaymentType: PaymentType.Card,
            preferredPaymentType: PaymentType.Card,
        },
    });

let mockStores: IHolidaysStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const setApplePayTogglesMockValues = (IsApplePayEnabled: boolean) => {
    mockStores.layoutStore.getSettingAsBoolean = jest.fn(setting => {
        if (setting === SiteSettings.IsApplePayEnabled) {
            return IsApplePayEnabled;
        }

        return false;
    });
};

describe('ApplePayEnabler', () => {
    beforeEach(() => {
        mockStores = createStore();
    });

    it('should load ApplePay SDK script', async () => {
        setApplePayTogglesMockValues(true);
        render(<ApplePayEnabler />);

        await waitFor(() => {
            expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
        });
    });

    it('should set Apple Pay available if device / browser is ApplePay compatible', async () => {
        setApplePayTogglesMockValues(true);
        canMakePaymentsMock.mockReturnValue(true);

        render(<ApplePayEnabler />);

        await waitFor(() => {
            expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
            expect(setApplePayAvailable).toHaveBeenCalled();
        });
    });

    it('should NOT set Apple Pay available if device / browser is NOT ApplePay compatible', async () => {
        setApplePayTogglesMockValues(true);
        canMakePaymentsMock.mockReturnValue(false);

        render(<ApplePayEnabler />);

        await waitFor(() => {
            expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(setApplePayAvailable).not.toHaveBeenCalled();
        });
    });

    it('should NOT load ApplePay SDK script if toggle is disabled', async () => {
        setApplePayTogglesMockValues(false);

        render(<ApplePayEnabler />);

        await waitFor(() => {
            expect(screen.queryByTestId('apple-pay-sdk')).not.toBeInTheDocument();
        });
    });

    describe('ApplePay as default payment type', () => {
        Object.defineProperty(global.navigator, 'userAgent', {
            writable: true,
            value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        });

        beforeEach(() => {
            setApplePayTogglesMockValues(true);
            canMakePaymentsMock.mockReturnValue(true);
        });

        it('Should set Apple Pay as default option when using Safari browser', async () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            });

            render(<ApplePayEnabler />);

            await waitFor(() => {
                expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
                expect(setApplePayAvailable).toHaveBeenCalled();
                expect(setSelectedPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
                expect(setPreferredPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
            });
        });

        it('Should set Apple Pay as default option when in an iPhone', async () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
            });

            render(<ApplePayEnabler />);

            await waitFor(() => {
                expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
                expect(setApplePayAvailable).toHaveBeenCalled();
                expect(setSelectedPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
                expect(setPreferredPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
            });
        });

        it('Should set Apple Pay as default option when in an iPad', async () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPad; CPU iPad OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
            });

            render(<ApplePayEnabler />);

            await waitFor(() => {
                expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
                expect(setApplePayAvailable).toHaveBeenCalled();
                expect(setSelectedPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
                expect(setPreferredPaymentType).toHaveBeenCalledWith(PaymentType.ApplePay);
            });
        });

        it('Should set Card as default option when using Chrome AND NOT iPhone NOR iPad', async () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            });
            render(<ApplePayEnabler />);

            await waitFor(() => {
                expect(screen.queryByTestId('apple-pay-sdk')).toBeInTheDocument();
                expect(setApplePayAvailable).toHaveBeenCalled();
                expect(setSelectedPaymentType).not.toHaveBeenCalled();
                expect(setPreferredPaymentType).not.toHaveBeenCalled();
            });
        });
    });
});
