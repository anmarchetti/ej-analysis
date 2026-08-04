import { IPaymentAuthorizationCode } from 'models/enum/IPaymentAuthorizationCode';

export interface IPaymentAuthorization {
    acsTransID: string;

    acsURL: string;
    bookingReference: string;
    issuerUrl: string;
    md: string;

    messageVersion: string;
    methodNotificationURL: string;
    paReq: string;

    requestId: string;
    resultCode: IPaymentAuthorizationCode;
    sessionId: string;
    termUrl: string;

    threeDSMethodURL: string;
    threeDSServerTransID: string;
    transactionReference: string;
}
