import { action, makeObservable, observable } from 'mobx';

import { PaymentType } from 'models/enum/PaymentType';

export class PaymentTypeStore {
    constructor() {
        makeObservable(this);
    }

    @observable selectedPaymentType: PaymentType = PaymentType.Card;
    @observable paymentTypes: PaymentType[] = [PaymentType.Card];
    @observable preferredPaymentType: PaymentType = PaymentType.Card;

    @action setApplePayAvailable = (): void => {
        this.paymentTypes.push(PaymentType.ApplePay);
    };

    @action setApplePayUnavailable = (): void => {
        const indexToRemove = this.paymentTypes.indexOf(PaymentType.ApplePay);

        if (indexToRemove !== -1) {
            this.paymentTypes.splice(indexToRemove, 1);
        }

        this.selectedPaymentType = PaymentType.Card;
    };

    @action setSelectedPaymentType = (paymentType: PaymentType): void => {
        this.selectedPaymentType = paymentType;
    };

    @action setPreferredPaymentType = (paymentType: PaymentType): void => {
        this.preferredPaymentType = paymentType;
    };
}
