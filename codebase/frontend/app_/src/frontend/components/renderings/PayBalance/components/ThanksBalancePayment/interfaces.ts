import { MarketStore } from 'frontend/store/base';
import { IPayDetailsFull, IPayDetailsFullWithApplePay, TPayDetails } from 'models/data/payment/IPayDetails';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

export interface IThanksBalancePaymentProps extends IComponentWithDictionary {
    booking: any;
    formatMoney: MarketStore['formatMoney'];
    onBack: () => void;
    paidDetails: TPayDetails | IPayDetailsFullWithApplePay | undefined;
}

export interface IPayMethodItemProps {
    currency: string | undefined;
    details: IPayDetailsFull;
    formatMoney: TFormatMoney;
    getPhrase: IComponentWithDictionary['getPhrase'];
    hasApplePayPayment: boolean;
    maskApplePayCardNumber: string;
    showSplitAmount: boolean;
}

export interface ICreditMethodItemProps {
    creditAmount: number;
    currency: string | undefined;
    formatMoney: TFormatMoney;
    getPhrase: IComponentWithDictionary['getPhrase'];
    showSplitAmount: boolean;
}

type TFormatMoney = MarketStore['formatMoney'];
