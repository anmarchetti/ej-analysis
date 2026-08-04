import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';

export interface IPayBlockProps {
    applePayPaymentAuthorization: (
        event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ) => Promise<ICommitBookingRequestBody | void>;
    canPay: boolean;
    fatalPaymentError: boolean;
    onPay: () => void;
    requirePaymentAuthorization: boolean;
    amount?: number;
    amountLabel?: string;
    amountToPay?: number;
    applePayPaymentFormValidation?: () => boolean;
    applePayRedirect?: (bookingBody: ICommitBookingRequestBody) => void;
    usedCredit?: number;
}

export interface IAmountToPayProps {
    amount: number | undefined;
    currency: CurrencyCode | undefined;
}

export interface IPriceBreakdownProps {
    currency: CurrencyCode | undefined;
    formatMoney: (
        amount: number,
        config: { currency: CurrencyCode; trailingZeroDisplay: TrailingZeroDisplay },
    ) => string;
    getPhrase: (key: string) => string;
    amount?: number;
    amountLabel?: string;
    usedCredit?: number;
}
