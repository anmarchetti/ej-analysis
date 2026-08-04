import { action, computed, makeObservable, observable } from 'mobx';

import { ValidationConfig } from 'code/validation.config';
import { validate } from 'frontend/utils/validation.utils';

export interface IBillingInfo {
    address: string;
    address2: string;
    city: string;
    fullName: string;
    postCode: string;
}

export class BillingInfo {
    constructor(fullName?: string, address?: string, city?: string, postCode?: string, address2?: string) {
        makeObservable(this);

        this.fullName = fullName || '';
        this.address = address || '';
        this.city = city || '';
        this.postCode = postCode || '';
        this.address2 = address2 || '';
    }

    @validate(ValidationConfig.fullName) @observable fullName: string;
    @validate(ValidationConfig.address) @observable address: string;
    @validate(ValidationConfig.address2) @observable address2: string;
    @validate(ValidationConfig.city) @observable city: string;
    @validate(ValidationConfig.postCode) @observable postCode: string;

    @computed get isInfoPopulated(): boolean {
        return !!(this.fullName && this.address && this.city && this.postCode);
    }

    @action onChange = (field: string, value: string): void => {
        this[field] = value;
    };
}
