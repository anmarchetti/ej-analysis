import { action, computed, makeObservable, observable } from 'mobx';

import { ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { IValidationError } from 'models/data/validation/IValidationError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export interface IAgentLoginError {
    title: string;
    description?: string;
    isFatal?: boolean;
}

export class LoginAgent {
    constructor() {
        makeObservable(this);
    }

    @observable agentNumber: string = '';
    @observable password: string = '';
    @observable consultantName: string = '';
    @observable errors: IAgentLoginError[] = [];
    @observable rerenderKey: number = Math.random();

    @action onChangePassword = (value: string): void => {
        this.password = value;
        this.cleanUpErrors();
    };

    @action onChangeAgentNumber = (value: string): void => {
        this.agentNumber = value;
        this.cleanUpErrors();
    };

    @action onChangeConsultantName = (value: string): void => {
        const maxConsultantNameChars = 30;

        if (value.length > maxConsultantNameChars) return;

        this.consultantName = value;
        this.cleanUpErrors();
    };

    @action cleanUpErrors = (): void => {
        this.errors = [];
    };

    @action cleanUpModel = (): void => {
        this.agentNumber = '';
        this.consultantName = '';
        this.password = '';
        this.errors = [];
    };

    @computed get agentNumberErrors(): IValidationError[] {
        return validationService.validateField(this, 'agentNumber', [
            {
                ...ValidationConfig.required[0],
                message: SitecoreDictionary.TradePortalLoginPageAgentNumValidationText,
            },
        ]);
    }

    @computed get passwordErrors(): IValidationError[] {
        return validationService.validateField(this, 'password', [
            {
                ...ValidationConfig.required[0],
                message: SitecoreDictionary.TradePortalLoginPagePasswordValidationText,
            },
        ]);
    }

    @computed get consultantNameErrors(): IValidationError[] {
        return validationService.validateField(this, 'consultantName', [
            {
                ...ValidationConfig.required[0],
                message: SitecoreDictionary.TradePortalLoginPageConsultantNameValidationText,
            },
        ]);
    }

    @action rerender = (): void => {
        this.rerenderKey = Math.random();
    };

    @computed get firstError(): IAgentLoginError | boolean {
        const fatalErrors = this.errors.filter(el => !!el.isFatal);

        return (fatalErrors.length > 0 && fatalErrors[0]) || (this.errors.length > 0 && this.errors[0]);
    }
}
