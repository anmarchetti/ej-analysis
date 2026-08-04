import { action, computed, makeObservable, observable } from 'mobx';

import { ValidationConfig } from 'code/validation.config';
import { getCardType } from 'frontend/utils/payment.utls';
import { validate } from 'frontend/utils/validation.utils';
import { CardType } from 'models/enum/CardType';

export class CardInfo {
    constructor() {
        makeObservable(this);
    }

    @validate(ValidationConfig.cardName) @observable nameOnCard: string = '';
    @validate(ValidationConfig.cardNumber) @observable cardNumber: string = '';
    @validate(ValidationConfig.expiryDate) @observable expirationDate: string = '';
    @validate(ValidationConfig.cvvNumber) @observable cvv: string = '';
    @validate(ValidationConfig.issueNumber) @observable issueNumber: string = '';

    @computed get cardType(): CardType {
        return getCardType(this.cardNumber);
    }

    @action onChange = (field: string, value: string): void => {
        this[field] = value;
    };
}
