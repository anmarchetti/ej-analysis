import { action, makeObservable, observable } from 'mobx';

import validationService from 'frontend/services/validation.service';
import { validate } from 'frontend/utils/validation.utils';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ContactQueryType } from 'frontend/components/renderings/ContactUs/data/constants';

import { buildContactValidationConfig } from './contact.validation.config';

export enum ContactFormFields {
    DepartureAndReturnDate = 'departureAndReturnDate',
    BookingReference = 'bookingReference',
    About = 'about',
    Question = 'question',
    LeadPassengerFirstName = 'leadPassengerFirstName',
    LeadPassengerLastName = 'leadPassengerLastName',
    EmailAddress = 'emailAddress',
    DialingCode = 'dialingCode',
    ContactNumber = 'contactNumber',
    Attachments = 'attachments',
}

export class ContactInfo {
    @observable departureAndReturnDate: string = '';
    @observable bookingReference: string = '';
    @observable about: string = '';
    @observable question: string = '';
    @observable leadPassengerFirstName: string;
    @observable leadPassengerLastName: string;
    @observable emailAddress: string;
    @observable dialingCode?: string;
    @observable contactNumber?: string;
    @observable attachments: Nullable<File[]> = null;

    constructor(queryType: Nullable<ContactQueryType> = null) {
        makeObservable(this);

        this.initializeValidationRules(queryType);
    }

    get isValid(): boolean {
        const errors = validationService.validateModel(this);

        return errors.length === 0;
    }

    initializeValidationRules = (queryType: Nullable<ContactQueryType>, isBookingNotRequired?: boolean): void => {
        if (!queryType) return;

        const config = buildContactValidationConfig(queryType, isBookingNotRequired);

        Object.values(ContactFormFields).forEach(fieldName => {
            const fieldRules = config[fieldName];

            if (fieldRules?.length) {
                validate(fieldRules)(this, fieldName);
            }
        });
    };

    validateField = (field: ContactFormFields): IValidationError[] =>
        validationService.validateField(this, field as keyof ContactInfo);

    isValidField = (field: ContactFormFields): boolean => {
        const errors = this.validateField(field);

        return errors.length === 0;
    };

    @action onChangeField = (field: ContactFormFields, value: string | Nullable<File[]>): void => {
        this[field as string] = value;
    };
}
