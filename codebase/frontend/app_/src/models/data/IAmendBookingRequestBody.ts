import { IBookingPaymentInfo, IBrowserInfo } from './ICommitBookingRequestBody';
import { ILeadPassenger } from './ILeadPassenger';

export interface IAmendBookingRequestBody {
    browserInfo: IBrowserInfo;
    leadPassenger: ILeadPassenger;
    paymentInfo: IBookingPaymentInfo | IApplePayBookingPaymentInfo;
    convertType?: ConvertType;
    deviceId?: string;
    requestId?: string;
    sessionId?: string;
}

export interface IApplePayBookingPaymentInfo {
    amount: number;
    billingInfo: {
        address: string;
        city: string;
        fullName: string;
        postCode: string;
    };
    cardType: string;
    currency: string;
    paymentType: string;
    token: ApplePayJS.ApplePayPaymentToken;
    creditAmount?: number;
}

export enum ConvertType {
    REFUND = 'REFUND',
    CREDIT = 'CREDIT',
}
