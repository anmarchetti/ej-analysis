import { action, makeObservable, observable } from 'mobx';

import { FindBookingValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { validate } from 'frontend/utils/validation.utils';

import { IValidationError } from './validation/IValidationError';

export enum FindBookingInfoFields {
    BookingReference = 'bookingReference',
}

export class FindBookingInfo {
    @validate(FindBookingValidationConfig.bookingReference) @observable bookingReference: string = '';

    constructor() {
        makeObservable(this);
    }

    get isValid(): boolean {
        const errors = validationService.validateModel(this);

        return errors.length === 0;
    }

    validateField = (field: FindBookingInfoFields): IValidationError[] =>
        validationService.validateField(this, field as keyof FindBookingInfo);

    @action onChangeField = (field: FindBookingInfoFields, value: string | boolean | Nullable<File[]>): void => {
        this[field as string] = value;
    };
}
