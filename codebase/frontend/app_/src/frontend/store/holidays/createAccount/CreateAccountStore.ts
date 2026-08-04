import Axios, { CancelTokenSource } from 'axios';
import { Guid } from 'guid-typescript';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { UserService } from 'frontend/services/user.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { debounce } from 'frontend/utils/debounce';
import { ApiError } from 'models/data/ApiError';
import { CustomerDetails } from 'models/data/CustomerDetails';
import { ICustomerLoginError, LoginCustomer } from 'models/data/LoginCustomer';
import { ApiErrors } from 'models/enum/ApiErrors';
import SiteSettings from 'models/enum/SiteSettings';

export class CreateAccountStore {
    customerDetails = new CustomerDetails();
    customerDetailsKey: string;
    customerLogin = new LoginCustomer();
    createAccountErrors: ICustomerLoginError[] = [];
    forceErrors: boolean = false;
    isSignInState: boolean = false;
    isSuccessPopupShown: boolean = false;
    isCreateAccountSending: boolean = false;
    isCreateAccountPopupVisible: boolean = false;

    private validateEmailCancelSource: Nullable<CancelTokenSource>;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this, {
            customerDetails: observable,
            customerLogin: observable,
            forceErrors: observable,
            isSuccessPopupShown: observable,
            createAccountErrors: observable,
            isSignInState: observable,
            isCreateAccountSending: observable,
            isCreateAccountForbidden: computed,
            isCreateAccountPopupVisible: observable,
        });
    }

    get isFormValid(): boolean {
        return this.customerDetails.isValid;
    }

    get isCreateAccountForbidden(): boolean {
        return !this.customerLogin.isEmailValidated || this.customerLogin.isEmailExists;
    }

    initialize = action(async () => {
        const { userStore, routerStore } = this.rootStore;

        const isLoggedIn = await userStore.checkIfUserLoggedIn();

        if (isLoggedIn) {
            routerStore.redirectToHomePage();

            return;
        }

        await Promise.all([
            this.rootStore.appCatalogStore.countries.fetchData(),
            this.rootStore.appCatalogStore.dialingCodes.fetchData(),
        ]);

        this.customerLogin.cleanUpModel();
        this.resetCustomerDetails();
    });

    changeEmail = action((value: string) => {
        this.customerLogin.cleanUpModel();
        this.customerDetails.onChangeField('email', value);

        this.validateEmailDebounce();
    });

    validateEmail = action(async () => {
        if (!this.customerDetails.isFieldValid('email')) {
            return;
        }

        const email = this.customerDetails.email;

        try {
            if (this.validateEmailCancelSource) {
                this.validateEmailCancelSource.cancel();
            }

            this.validateEmailCancelSource = Axios.CancelToken.source();

            const isEmailExists = await UserService.verifyEmail(email, this.validateEmailCancelSource);
            runInAction(() => {
                // Update only if current email match the validated email (email is validating on input change)
                if (email === this.customerDetails.email) {
                    isEmailExists && this.toggleSignInState(true);
                    this.customerLogin.onChangeEmail(email);
                    this.customerLogin.toggleEmailValidated(true);
                    this.customerLogin.toggleEmailExists(isEmailExists);
                } else {
                    this.customerLogin.toggleEmailValidated(false);
                }
            });
        } catch (e) {
            if (e?.errorCode === ApiErrors.AcountLockedBySitecoreSettings) {
                if (email === this.customerDetails.email) {
                    this.toggleSignInState(true);
                    this.customerLogin.onChangeEmail(email);
                    this.customerLogin.toggleEmailValidated(true);
                    this.customerLogin.toggleEmailExists(true);
                } else {
                    this.customerLogin.toggleEmailValidated(false);
                }
            } else {
                runInAction(() => {
                    this.customerLogin.toggleEmailValidated(false);
                    this.customerLogin.toggleEmailExists(false);
                });
            }
        }
    });

    validateEmailDebounce = debounce(this.validateEmail, 250);

    toggleSignInState = action((state: boolean) => {
        this.isSignInState = state;

        if (this.isSignInState) {
            this.resetCustomerDetails();
        } else {
            this.customerDetails.onChangeField('email', this.customerLogin.email);
        }
    });

    toggleForceErrors = action((state: boolean) => {
        this.forceErrors = state;
    });

    toggleSuccessPopup = action((state: boolean) => {
        this.isSuccessPopupShown = state;
    });

    signIn = action(async () => {
        try {
            await this.rootStore.userStore.signIn(this.customerLogin.email, this.customerLogin.password);
            this.rootStore.routerStore.redirectToViewBookingsPage();
        } catch (e) {
            runInAction(() => {
                this.customerLogin.errors = this.rootStore.userStore.customerErrorHandler(e as ApiError, true);
            });
        }
    });

    createAccount = action(async (actionAfterSubmitting?: () => void) => {
        this.isCreateAccountSending = true;

        try {
            await this.rootStore.userStore.register(this.customerDetails.formData, this.customerDetails.password);
            this.customerLogin.onChangeEmail(this.customerDetails.email);

            if (actionAfterSubmitting) {
                actionAfterSubmitting();
            } else {
                this.rootStore.routerStore.redirectToHomePage();
                this.toggleSuccessPopup(true);
            }
        } catch (e) {
            runInAction(() => {
                this.createAccountErrors = this.rootStore.userStore.customerErrorHandler(e as ApiError);
            });
        } finally {
            runInAction(() => {
                this.isCreateAccountSending = false;
            });
        }
    });

    resetCustomerDetails = action(() => {
        this.customerDetails.resetFields();

        const { getSetting, passwordProhibitedWords } = this.rootStore.layoutStore;

        this.customerDetails.setPasswordValidationRules(passwordProhibitedWords);
        this.customerDetails.onChangeField('countryCode', getSetting(SiteSettings.DefaultCountryCode) || '');
        this.customerDetails.onChangeField('dialingCode', getSetting(SiteSettings.DefaultDialingCode) || '');

        // Update key. It's used to rerender fields (clear all touch/ blur states and hide errors)
        this.customerDetailsKey = Guid.create().toString();

        this.forceErrors = false;
    });

    setCreateAccountPopupVisible = action((state: boolean) => {
        this.isCreateAccountPopupVisible = state;
    });
}
