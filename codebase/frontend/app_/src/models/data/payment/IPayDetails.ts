import { CardType } from 'models/enum/CardType';
import { PaymentType } from 'models/enum/PaymentType';

import { IBillingInfo } from './BillingInfo';
import { CardInfo } from './CardInfo';
import IApplePayInfo from './IApplePayInfo';

export interface IPayDetailsFull extends CardInfo {
    amount: number;
    billingInfo: IBillingInfo;
    cardType: CardType;
    creditAmount?: number;
}

export interface IPayDetailsOnlyCredit {
    creditAmount: number;
}

export interface IPayDetailsFullWithApplePay extends IApplePayInfo {
    amount: number;
    billingInfo: IBillingInfo;
    cardType: string;
    paymentType: PaymentType;
    creditAmount?: number;
}

export type TPayDetails = IPayDetailsFull | IPayDetailsOnlyCredit;
