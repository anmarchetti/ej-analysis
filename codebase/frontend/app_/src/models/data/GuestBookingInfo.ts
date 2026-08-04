import { action, computed, makeObservable, observable } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { parseDateL10n } from 'frontend/utils/date.utils';
import { validate } from 'frontend/utils/validation.utils';

import { IValidationError } from './validation/IValidationError';

export enum GuestBookingInfoFields {
    DepartureDate = 'departureDate',
    BookingReference = 'bookingReference',
    LastName = 'lastName',
}

export class GuestBookingInfo {
    @validate(ValidationConfig.departureDate) @observable departureDate: string = '';
    @validate(ValidationConfig.bookingReference) @observable bookingReference: string = '';
    @validate(ValidationConfig.lastName) @observable lastName: string = '';

    constructor(bookingReference?: string, departureDate?: string, lastName?: string) {
        makeObservable(this);

        if (bookingReference) {
            this.bookingReference = bookingReference;
        }

        if (departureDate) {
            this.departureDate = departureDate;
        }

        if (lastName) {
            this.lastName = lastName;
        }
    }

    @computed get departureDateObject(): Date {
        return parseDateL10n(this.departureDate, DATE_FORMATS.inputField, true) || new Date();
    }

    get isValid(): boolean {
        let errors = [] as IValidationError[];
        errors = validationService.validateModel(this);

        return errors.length === 0;
    }

    @action onChangeField(field: GuestBookingInfoFields, value: string): void {
        this[field] = value;
    }

    /**
     * Clears all guest details data
     */
    @action clearData(): void {
        this.departureDate = '';
        this.bookingReference = '';
        this.lastName = '';
    }
}
