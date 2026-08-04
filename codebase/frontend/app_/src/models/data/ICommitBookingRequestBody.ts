import { GuestInfo } from 'models/GuestInfo';

import { IAirportParking } from './externalExtras/IAirportParking';
import { IThreeDSTechnicalErrors } from './payment/IThreeDSData';
import { IExtraLuggageInfo } from './IFlightExtras';
import { ILeadPassenger } from './ILeadPassenger';
import { IOffer } from './IOffer';

export interface ICommitBookingRequestBody {
    browserInfo: IBrowserInfo;
    guests: GuestInfo[];
    leadPassenger: ILeadPassenger;
    offer: IOffer;
    paymentInfo: IBookingPaymentInfo | IApplePayBookingPaymentInfo;
    airportParking?: IAirportParking;
    bookingReference?: string;
    deviceId?: string;
    discount?: string;
    extraLuggageInfo?: IExtraLuggageInfo;
    requestId?: string;
    seatSelection?: any;
    sessionId?: string;
    specialRequests?: string;
}

export interface IBookingPaymentInfo extends IThreeDSTechnicalErrors {
    amount: number;
    billingInfo: {
        address: string;
        city: string;
        fullName: string;
        postCode: string;
    };
    cardNumber: string;
    cardType: string;
    cvv: string;
    expirationDate: string;
    nameOnCard: string;
    challengeComplete?: boolean;
    issuerUrl?: string;
    md?: string;
    paRes?: string;
    threeDSServerTransID?: string;
    transStatus?: string;
    transactionReference?: string;
}

export interface IBrowserInfo {
    acceptHeader: string; //"application/json,text/plain,*/*",
    colourDepth: number; //11.89,
    javaEnabled: boolean; //"false",
    javaScriptEnabled: boolean; //"true",
    language: string; //"en-GB",
    screenHeight: number; //1089990.77,
    screenWidth: number; //192099.66,
    timeZoneOffset: number; //-60
    userAgent: string; //"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
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
}
