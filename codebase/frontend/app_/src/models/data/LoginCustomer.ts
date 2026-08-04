import { action, computed, makeObservable, observable } from 'mobx';

import { buildCreatePasswordValidationRules, ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { validate } from 'frontend/utils/validation.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';

import { IValidationError } from './validation/IValidationError';
import { TValidationRules } from './validation/IValidationRules';

export interface ICustomerLoginError {
    title: string;
    description?: string;
    isFatal?: boolean;
}

export class LoginCustomer {
    constructor(isNewCustomer?: boolean) {
        makeObservable(this);
        this.setIsNewCustomer(!!isNewCustomer);
    }

    @observable isNewCustomer: boolean;

    @observable alreadyLoggedEmail: string = '';

    @validate(ValidationConfig.email) @observable email: string = '';
    @validate(ValidationConfig.password) @observable password: string = '';

    @observable passwordProhibitedWords: string[] = [];

    @observable errors: ICustomerLoginError[] = [];
    @observable rerenderKey: number = Math.random();

    @observable isEmailExists: boolean;
    @observable isEmailValidated: boolean;
    @observable isEmailDisabled: boolean;
    @observable forceErrors: boolean = false;

    @action onChangePassword = (value: string): void => {
        this.password = value;
    };

    @action onChangeLoggedEmail = (value: string): void => {
        this.alreadyLoggedEmail = value;
    };

    @action cleanUpErrors = (): void => {
        this.errors = [];
    };

    @action onChangeEmail = (value: string, forcePassword: boolean = true): void => {
        this.email = value;
        this.isEmailValidated = false;
        this.isEmailExists = false;

        if (forcePassword) {
            this.onChangePassword('');
        }
    };

    @action toggleEmailValidated = (state: boolean): void => {
        this.isEmailValidated = state;
    };

    @action toggleEmailExists = (state: boolean): void => {
        this.isEmailExists = state;
    };

    @action toggleEmailDisabled = (state: boolean): void => {
        this.isEmailDisabled = state;
    };

    @action cleanUpModel = (): void => {
        // don't clean alreadyLoggedEmail for save actual value
        // this field set by onChangeLoggedEmail
        // this.alreadyLoggedEmail = '';
        this.email = '';
        this.password = '';
        this.errors = [];
        this.isEmailExists = false;
        this.isEmailValidated = false;
        this.isEmailDisabled = false;
    };

    @computed get emailErrors(): IValidationError[] {
        const errors = validationService.validateField(this, 'email');

        if (this.alreadyLoggedEmail?.toLowerCase() === this.email.toLowerCase()) {
            errors.push({
                errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesEmailAlreadyLoggedWith,
                trigger: ValidationType.OnBlur,
            });
        }

        return errors;
    }

    @computed get passwordErrors(): IValidationError[] {
        return validationService.validateField(this, 'password', this.passwordValidationRules);
    }

    @computed get passwordValidationRules(): TValidationRules[] {
        return this.isNewCustomer
            ? buildCreatePasswordValidationRules(this.passwordProhibitedWords)
            : ValidationConfig.password;
    }

    @computed get firstError(): ICustomerLoginError {
        const fatalErrors = this.errors.filter(el => !!el.isFatal);

        return (fatalErrors.length > 0 && fatalErrors[0]) || this.errors[0];
    }

    @action rerender = (): void => {
        this.rerenderKey = Math.random();
    };

    @action setIsNewCustomer = (state: boolean): void => {
        this.isNewCustomer = state;
    };

    @action setPasswordProhibitedWords = (words: string[]): void => {
        this.passwordProhibitedWords = words;
    };

    @action setForceErrors = (state: boolean): void => {
        this.forceErrors = state;
    };
}
