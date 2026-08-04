import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { envPublic } from 'code/env';
import { logger } from 'frontend/services/logging';
import BaseGuestDetailsStore from 'frontend/store/base/guestDetails/BaseGuestDetailsStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import { convertGuestInfoToCustomerDetails } from 'frontend/utils/passenger.utils';
import {
    generateDeviceId,
    getTransaction,
    isTransactionDone,
    isTransactionProcessing,
} from 'frontend/utils/paymentTransaction';
import { submitForm } from 'frontend/utils/submitForm';
import { ApiError } from 'models/data/ApiError';
import { LoginCustomer } from 'models/data/LoginCustomer';
import { IValidationError } from 'models/data/validation/IValidationError';
import { AdultTitles } from 'models/enum/CustomerTitles';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { SubmitPayload } from 'models/enum/SubmitPayload';

export enum OfferSectionTypes {
    IsOffersOptedIn = 'isOffersOptedIn',
    IsPartnerOffersOptedIn = 'isPartnerOffersOptedIn',
}

export class GuestDetailsStore extends BaseGuestDetailsStore {
    @observable isOffersOptedIn: Nullable<boolean>;
    @observable isPartnerOffersOptedIn: Nullable<boolean>;

    @observable guestDetailsPhase: Nullable<GuestDetailsPhase>;

    @observable customerLogin: LoginCustomer = new LoginCustomer();

    @observable hasSignInPrompt: Nullable<boolean> = null;
    @observable isAddressLookup: boolean = true;

    // Unique guid per session for current device
    deviceId: string = '';

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @computed get specialOffersVisible(): boolean {
        return !this.rootStore.userStore.isLoggedIn && this.shouldCreateAccount;
    }

    @computed get isSpecialOffersSectionValid(): boolean {
        if (!this.specialOffersVisible) {
            return true;
        }

        if (this.isOffersOptedIn != undefined) {
            return this.isOffersOptedIn ? this.isPartnerOffersOptedIn != undefined : true;
        }

        return false;
    }

    @computed get shouldCreateAccount(): boolean {
        return this.customerLogin.isEmailValidated && !this.customerLogin.isEmailExists;
    }

    get formErrors(): IValidationError[] {
        return [...this.guestDetailsErrors, ...this.customerLoginErrors];
    }

    @computed get customerLoginErrors(): IValidationError[] {
        return this.shouldCreateAccount ? this.customerLogin.passwordErrors : [];
    }

    get isFormValid(): boolean {
        return this.formErrors.length === 0 && this.confirmPolicy && this.isSpecialOffersSectionValid;
    }

    @action initialize = async (hasSignInPrompt: boolean = false) => {
        this.cleanUpGuestDetails();
        this.customerLogin.cleanUpModel();
        this.customerLogin.setPasswordProhibitedWords(this.rootStore.layoutStore.passwordProhibitedWords);
        this.hasSignInPrompt = hasSignInPrompt;
        await this.rootStore.userStore.setUserDetails();

        runInAction(() => {
            this.createGuestsDetails(true);
            this.customerLogin.toggleEmailExists(this.rootStore.userStore.isLoggedIn);
            this.customerLogin.toggleEmailValidated(this.rootStore.userStore.isLoggedIn);

            // do not update url if in experience editor and no selected offer ()
            if (this.rootStore.layoutStore.isExperienceEditor && !this.rootStore.bookingStore.selectedOffer) {
                return;
            }

            this.toggleGuestDetailsPhase(
                this.rootStore.userStore.isLoggedIn ? GuestDetailsPhase.GuestsInfo : GuestDetailsPhase.VerifyEmail,
            );
        });

        const transaction = getTransaction();

        if (
            transaction &&
            (isTransactionDone(transaction) || isTransactionProcessing(transaction)) &&
            this.isFormValid
        ) {
            this.onSelectContinue();
        }

        this.deviceId = generateDeviceId();
        this.sendDeviceDetails(this.deviceId);
    };

    @action initializeEmailVerificationPage = () => {
        if (this.rootStore.userStore.isLoggedIn) {
            // Don't reload page on logout (EJH-9638)
            this.rootStore.userStore.onLogout(true);
        }

        const leadEmail =
            this.leadPassenger?.email || this.customerLogin.email || this.getLeadEmailFromSessionStorage();
        this.customerLogin.cleanUpModel();
        this.createGuestsDetails();
        this.customerLogin.onChangeEmail(leadEmail || '');
    };

    @action initializeGuestsInfoPage = () => {
        if (!this.customerLogin.isEmailValidated) {
            this.toggleGuestDetailsPhase(GuestDetailsPhase.VerifyEmail);

            return;
        }

        this.customerLogin.cleanUpErrors();
        this.cleanUpGuestDetails(true);
        this.updateGuestsDetailsWithSessionData();
        this.updateLeadGuest();
        this.loadReferenceData();
    };

    @action onSelectContinue = async () => {
        const { userStore, trackingStore } = this.rootStore;

        try {
            if (this.leadPassenger && this.shouldCreateAccount) {
                const customer = convertGuestInfoToCustomerDetails(
                    this.leadPassenger,
                    !!this.isOffersOptedIn,
                    !!this.isPartnerOffersOptedIn,
                );
                await userStore.register(customer, this.customerLogin.password);
            }

            this.saveGuestDetailsToSessionStorage();
            this.rootStore.trackingStore.setPreviousPage();
            trackingStore.continueToPaymentTrigger();
            this.submitGuestsForm();
        } catch (e) {
            runInAction(() => {
                this.customerLogin.errors = userStore.customerErrorHandler(e as ApiError);

                if (this.customerLogin.errors.some(el => !!el.isFatal) && this.leadPassenger) {
                    const leadEmail = this.leadPassenger.email;
                    this.createGuestsDetails(true);
                    this.customerLogin.onChangeEmail(leadEmail || '');
                }
            });
            throw e;
        }
    };

    @action validateEmail = async () => {
        try {
            if (this.rootStore.userStore.isVerifyingEmail) {
                return;
            }

            const res = !!(await this.rootStore.userStore.verifyEmail(this.customerLogin.email));
            runInAction(() => {
                this.customerLogin.toggleEmailValidated(true);
                this.customerLogin.toggleEmailExists(res);
                this.customerLogin.setIsNewCustomer(!res);
                this.customerLogin.cleanUpErrors();

                if (!this.customerLogin.isEmailExists || !this.hasSignInPrompt) {
                    this.toggleGuestDetailsPhase(GuestDetailsPhase.GuestsInfo);
                }

                this.rootStore.trackingStore.trackAccountIdentifiedEvent(this.customerLogin.isEmailExists);
            });
        } catch (e) {
            runInAction(() => {
                this.customerLogin.errors = this.rootStore.userStore.customerErrorHandler(e as ApiError);
                this.customerLogin.toggleEmailValidated(false);
                this.customerLogin.toggleEmailExists(false);
                this.customerLogin.setIsNewCustomer(false);
            });
        }
    };

    @action signIn = async (gaCallback: () => void): Promise<void> => {
        try {
            await this.rootStore.userStore.signIn(this.customerLogin.email, this.customerLogin.password);
            this.updateLeadGuest();
            this.toggleGuestDetailsPhase(GuestDetailsPhase.GuestsInfo);
            gaCallback();
        } catch (e) {
            runInAction(() => {
                this.customerLogin.errors = this.rootStore.userStore.customerErrorHandler(e as ApiError, true);
            });
        }
    };

    @action toggleGuestDetailsPhase = (phase?: GuestDetailsPhase) => {
        this.guestDetailsPhase = phase || GuestDetailsPhase.VerifyEmail;
    };

    @action clearGuestDetailsPhase = () => {
        this.guestDetailsPhase = null;
    };

    @action cleanUpGuestDetails = (ignorePhase: boolean = false) => {
        this.isOffersOptedIn = undefined;
        this.isPartnerOffersOptedIn = undefined;
        this.confirmPolicy = false;
        this.forceErrors = false;

        if (!ignorePhase) {
            this.clearGuestDetailsPhase();
        }
    };

    @action changeOffersAndUpdates = (field: OfferSectionTypes, value: boolean) => {
        if (field === OfferSectionTypes.IsPartnerOffersOptedIn) {
            this.isOffersOptedIn = value ? null : false;
        }

        this[field] = value;
    };

    @action private updateLeadGuest = () => {
        if (!this.leadPassenger) {
            return;
        }

        const { userData } = this.rootStore.userStore;
        const leadEmail = this.getLeadEmailFromSessionStorage();

        // Update Lead Passenger fields,
        // if User is logged in and his email doesn't match the email of lead passenger saved in session storage
        if (userData?.email && !(leadEmail && leadEmail === userData.email)) {
            const dateObject = parseDateL10n(userData.birthDate, DATE_FORMATS.query);
            const date = formatDateL10n(dateObject, DATE_FORMATS.inputField);
            this.leadPassenger.email = userData.email;
            this.leadPassenger.firstName = userData.firstName;
            this.leadPassenger.lastName = userData.lastName;
            this.leadPassenger.title = userData.title;
            this.leadPassenger.defaultTitle = userData.title
                ? {
                      value: userData.title,
                      label: this.getValidTitle(userData.title),
                  }
                : null;
            this.leadPassenger.dialingCode =
                userData.dialingCode || this.rootStore.layoutStore.getSetting(SiteSettings.DefaultDialingCode) || '';
            this.leadPassenger.phone = userData.mobilePhone;
            this.leadPassenger.dateOfBirth = date;
            this.leadPassenger.countryCode =
                userData.countryCode || this.rootStore.layoutStore.getSetting(SiteSettings.DefaultCountryCode) || '';
            this.leadPassenger.address = userData.address1;
            this.leadPassenger.address2 = userData.address2;
            this.leadPassenger.city = userData.city;
            this.leadPassenger.postCode = userData.postalCode;
            this.customerLogin.email = userData.email;
        } else {
            this.customerLogin.email = this.customerLogin.email || leadEmail || '';
            this.leadPassenger.email = this.customerLogin.email;
        }
    };

    @action private sendDeviceDetails(transactionId: string | undefined) {
        const collectorUrl = envPublic.PAYMENT_DEVICE_COLLECTOR_URL;
        const siteKey = envPublic.PAYMENT_DEVICE_SITE_KEY;

        if (!transactionId || !collectorUrl || !siteKey) return;

        try {
            window._cc = window._cc || [];
            const _cc = window._cc;

            _cc.push([
                'ci',
                {
                    sid: siteKey,
                    tid: transactionId,
                },
            ]);

            _cc.push(['run', ('https:' == document.location.protocol ? 'https://' : 'http://') + collectorUrl]);
            _cc.push(['st', 500]);
            (function () {
                const c = document.createElement('script');
                c.type = 'text/javascript';
                c.async = true;
                c.src =
                    ('https:' == document.location.protocol ? 'https://' : 'http://') +
                    collectorUrl +
                    '/cc.js?sid=' +
                    siteKey +
                    '&ts=' +
                    new Date().getTime() +
                    '&tid=' +
                    transactionId;
                const s = document.getElementsByTagName('script')[0];
                s.parentNode?.insertBefore(c, s);
            })();
        } catch (e) {
            logger.error({
                e: e,
                message: 'Unexpected error with InAuth fraud script',
            });
        }
    }

    public submitGuestsForm = () => {
        submitForm(
            `${this.rootStore.layoutStore.basePath}${
                SitePath.Payment
            }${this.rootStore.queryParamsStore.buildHotelDetailsQuery()}`,
            SubmitPayload.GuestsInfo,
            {
                ...this.rootStore.bookingStore.commitBookingGuestsInfo,
                deviceId: this.deviceId,
            },
        );
    };

    public getValidTitle = (title: string) => {
        const { getPhrase } = this.rootStore.layoutStore;
        const titleData = AdultTitles.find(item => item.value === title);

        return titleData?.label ? getPhrase(titleData?.label) : '';
    };

    @action setIsAddressLookup = (state: boolean): void => {
        this.isAddressLookup = state;
    };
}
