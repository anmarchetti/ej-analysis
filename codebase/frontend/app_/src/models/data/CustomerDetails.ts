import { action, computed, makeObservable, observable } from 'mobx';

import { buildCreatePasswordValidationRules, ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { OfferSectionTypes } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';
import { trimPhoneNumber } from 'frontend/utils/phoneNumber.utils';
import { validate } from 'frontend/utils/validation.utils';

import { IValidationError } from './validation/IValidationError';
import { ILoginInfo } from './ILoginInfo';

export class CustomerDetails {
    // Fields with static validation rules
    @validate(ValidationConfig.email) @observable email: string;
    @validate(ValidationConfig.title) @observable title: string;
    @validate(ValidationConfig.firstName) @observable firstName: string;
    @validate(ValidationConfig.lastName) @observable lastName: string;
    @validate(ValidationConfig.address) @observable address1: string;
    @validate(ValidationConfig.address2) @observable address2: string;
    @validate(ValidationConfig.city) @observable city: string;
    @validate(ValidationConfig.postCode) @observable postalCode: string;
    @validate(ValidationConfig.countryCode) @observable countryCode: string;
    @validate(ValidationConfig.dialingCode) @observable dialingCode: string;
    @validate(ValidationConfig.phone) @observable mobilePhone: string;

    // Fields with dynamic validation rules, e.g. depends on Sitecore Settings, DataSources, etc.
    @observable password: string;

    @observable mailingsFlag: Nullable<boolean> = null;
    @observable easyJetMailingsFlag: Nullable<boolean> = null;
    @observable airport1: string;
    @observable airport2: string;
    @observable airport3: string;

    constructor() {
        makeObservable(this);
    }

    get formData(): ILoginInfo {
        return {
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            title: this.title,
            mobilePhone: trimPhoneNumber(this.mobilePhone, this.dialingCode),
            birthDate: '',
            dialingCode: this.dialingCode,
            countryCode: this.countryCode,
            address1: this.address1,
            address2: this.address2,
            city: this.city,
            postalCode: this.postalCode,
            mailingsFlag: !!this.mailingsFlag,
            easyJetMailingsFlag: !!this.easyJetMailingsFlag,
            preferredAirports: this.preferredAirports,
        };
    }

    get isValid(): boolean {
        const errors = validationService.validateModel(this);

        return errors.length === 0 && this.isMailingsFlagsValid;
    }

    get isMailingsFlagsValid(): boolean {
        /** Mailings flags must be true/false. They are not valid if they are null, that means that user haven't select any option*/
        if (this.mailingsFlag !== null) {
            return this.mailingsFlag ? this.easyJetMailingsFlag !== null : true;
        }

        return false;
    }

    @computed get preferredAirports(): string[] {
        const airports: string[] = [];

        if (this.airport1) airports.push(this.airport1);

        if (this.airport2) airports.push(this.airport2);

        if (this.airport3) airports.push(this.airport3);

        return airports;
    }

    isFieldValid = (field: keyof CustomerDetails): boolean => {
        const errors = this.validateField(field);

        return errors.length === 0;
    };

    isFieldRequired = (field: keyof CustomerDetails): boolean => validationService.isFieldRequired(this, field);

    validateField = (field: keyof CustomerDetails): IValidationError[] => validationService.validateField(this, field);

    @action onChangeField = (field: keyof CustomerDetails, value: string | boolean): void => {
        this[field as string] = value;
    };

    @action onChangeMailingsFlag = (field: OfferSectionTypes, value: boolean): void => {
        if (field === OfferSectionTypes.IsPartnerOffersOptedIn) {
            this.easyJetMailingsFlag = value;
            this.mailingsFlag = value ? null : false;
        } else {
            this.mailingsFlag = value;
        }
    };

    @action resetFields = (): void => {
        this.email = '';
        this.password = '';
        this.title = '';
        this.firstName = '';
        this.lastName = '';
        this.address1 = '';
        this.address2 = '';
        this.city = '';
        this.postalCode = '';
        this.countryCode = '';
        this.dialingCode = '';
        this.mobilePhone = '';
        this.mailingsFlag = null;
        this.easyJetMailingsFlag = null;
        this.airport1 = '';
        this.airport2 = '';
        this.airport3 = '';
    };

    setPasswordValidationRules = (prohibitedWords: string[] = []): void => {
        const rules = buildCreatePasswordValidationRules(prohibitedWords);
        validate(rules)(this, 'password');
    };
}
