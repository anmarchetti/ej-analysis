import { AxiosError } from 'axios';
import { action, computed, makeObservable, observable, reaction, runInAction, when } from 'mobx';

import { logger } from 'frontend/services/logging';
import promocodeService from 'frontend/services/promocode.service';
import { UserService } from 'frontend/services/user.service';
import { BaseUserStore } from 'frontend/store/base';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { isIE } from 'frontend/utils/browser.utils';
import { ApiError } from 'models/data/ApiError';
import { ApiErrorMessage, IApiErrorData } from 'models/data/ApiErrorData';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { ICustomerLoginError, LoginCustomer } from 'models/data/LoginCustomer';
import { IBillingInfo } from 'models/data/payment/BillingInfo';
import { ApiErrors } from 'models/enum/ApiErrors';
import { ReCaptchaAction } from 'models/enum/ReCaptchaAction';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class UserStore extends BaseUserStore {
    @observable customerLogin: LoginCustomer = new LoginCustomer();
    @observable rememberMe = false;
    @observable isRedirectPreventedAfterLogin = false;
    @observable userData: Nullable<ILoginInfo>;
    @observable formRerenderTrigger: number = Math.random();
    @observable isLoginTabActive: boolean = true;
    @observable isLoginPopupShown: boolean = false;
    @observable isGettingUserInfo: boolean = false;

    public isVerifyingEmail: boolean = false;
    public isResettingPassword: boolean = false;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);

        // CSSDA-615:
        // This was implemented in order to fix the situation when after a redirect from the payment page,
        // userData disappears, but it is necessary to have it
        reaction(
            () => this.isLoggedIn,
            isLoggedIn => {
                if (!isLoggedIn) {
                    return;
                }

                // TODO: Refactor -> check for "setUserDetails" and remove if needed
                this.setUserDetails();
            },
        );
    }

    @action setIsRedirectPreventedAfterLogin = (value: boolean): void => {
        this.isRedirectPreventedAfterLogin = value;
    };

    @action rerenderForm = (): void => {
        this.formRerenderTrigger = Math.random();
    };

    @action setRememberMe = (value: boolean): void => {
        this.rememberMe = value;
    };

    @action setUserData = (value: ILoginInfo): void => {
        this.userData = value;
    };

    @action clearUserStore = (): void => {
        this.customerLogin.cleanUpModel();
        this.rootStore.viewBookingStore.clearGuestBookingInfo();
        this.rememberMe = false;
        this.isRedirectPreventedAfterLogin = false;
        this.userData = null;
        this.isLoggedIn = false;
        this.customerLogin.onChangeLoggedEmail('');
    };

    @action initializeCustomerLogin = (): void => {
        this.customerLogin.onChangeLoggedEmail(this.userData?.email ?? '');
    };

    public onLogin = async (logoutIfLoggedIn = true, afterSignInAction?: () => void): Promise<void> => {
        try {
            if (this.isLoggedIn && logoutIfLoggedIn) {
                await this.onLogout();
            }

            await this.signIn(
                this.customerLogin.email,
                this.customerLogin.password,
                this.rememberMe,
                afterSignInAction,
            );
            await this.rootStore.shortlistStore.getShortlistStatus();

            if (!this.isRedirectPreventedAfterLogin) {
                this.rootStore.viewBookingStore.clearGuestBookingInfo();
                this.rootStore.routerStore.redirectTo(this.redirectUrlLocal); //

                // if Internet Explorer reload the page for correct cookies work (EJH-8171)
                if (isIE()) {
                    setTimeout(() => location.reload(), 1);
                }
            }
        } catch (e) {
            runInAction(() => {
                this.customerLogin.errors = this.customerErrorHandler(e as ApiError, true);
            });
        }
    };

    setUserLoggedIn = async (): Promise<void> => {
        const { isEditMode } = this.rootStore.layoutStore;

        if (this.isLoggedIn || isEditMode) {
            return;
        }

        if (this.isGettingUserStatus) {
            await when(() => this.isGettingUserStatus === false);

            return;
        }

        try {
            this.setIsGettingUserStatus(true);

            const isLoggedIn = await UserService.getStatus(false);

            this.setIsLoggedIn(isLoggedIn);

            if (isLoggedIn && 'shortlistStore' in this.rootStore) {
                await this.rootStore.shortlistStore.getShortlistStatus();
            }
        } catch (e) {
            this.setIsLoggedIn(false);
        } finally {
            this.setIsGettingUserStatus(false);
        }
    };

    @action public signIn = async (
        email: string,
        password: string,
        rememberMe: boolean = false,
        afterSignInAction?: () => void,
    ): Promise<void> => {
        try {
            const captcha = await this.rootStore.reCaptchaStore.executeReCaptcha(ReCaptchaAction.Login);
            const data = await UserService.logIn(email, password, rememberMe, captcha);

            this.setIsLoggedIn(true);
            this.setUserData(data);

            afterSignInAction?.();

            this.rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage();
            this.rootStore.trackingStore.trackAccountEvent(EventTypes.SuccessfulLogin);
            this.rootStore.engageStore.sendCustomEvent(EventTypes.LogIn);
        } catch (e) {
            logger.error({
                e,
                message: ApiErrorMessage.SignInFail,
            });

            const error = new ApiError(e);
            this.rootStore.trackingStore.trackAccountEvent(EventTypes.UnsuccessfulLogin);
            throw error;
        }
    };

    @action public register = async (
        customer: ILoginInfo,
        password: string,
        rememberMe: boolean = false,
    ): Promise<void> => {
        try {
            const userData = await UserService.register(customer, password, rememberMe);

            this.setIsLoggedIn(true);
            this.setUserData(userData);

            this.rootStore.trackingStore.trackAccountEvent(EventTypes.SuccessfulRegistration);
            this.rootStore.engageStore.sendCustomEvent(EventTypes.AccountCreated);
        } catch (e) {
            logger.error({
                e,
                message: ApiErrorMessage.RegistrationFail,
            });

            const error = new ApiError(e);
            this.rootStore.trackingStore.trackAccountEvent(EventTypes.UnsuccessfulRegistration);
            throw error;
        }
    };

    @action public verifyEmail = async (email: string): Promise<boolean | undefined> => {
        if (this.isVerifyingEmail) {
            return;
        }

        try {
            this.isVerifyingEmail = true;

            return await UserService.verifyEmail(email);
        } catch (e) {
            throw new ApiError(e);
        } finally {
            this.isVerifyingEmail = false;
        }
    };

    @action public resetPassword = async (email: string): Promise<void> => {
        if (this.isResettingPassword) {
            return await when(() => this.isResettingPassword === false);
        }

        try {
            this.isResettingPassword = true;
            const response = await UserService.resetPassword(email);

            // If the request was successful, but for e.g. the email does not exist, throw an error
            if (response?.data?.code === ApiErrors.ResetPasswordError) {
                throw new ApiError({
                    response,
                } as AxiosError<IApiErrorData>);
            }
        } catch (e) {
            throw new ApiError(e);
        } finally {
            this.isResettingPassword = false;
        }
    };

    public onLogout = async (isSoftLogout = false): Promise<void> => {
        try {
            if (this.isLoggingOut) {
                await when(() => this.isLoggingOut === false);

                return;
            }

            this.setIsLoggingOut(true);
            await UserService.logOut();
            this.clearUserStore();
            this.rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage();
            this.rootStore.shortlistStore.setShortlistedCount(null);
            sessionStorage.removeItem(WebStorageKeys.IsVoucherRedeemedBookingFlow);
            sessionStorage.removeItem(WebStorageKeys.LatestConfirmedBooking);
        } finally {
            this.setIsLoggingOut(false);

            if (!isSoftLogout) {
                const { routerStore, layoutStore } = this.rootStore;

                if (
                    routerStore.isViewBookingPage() ||
                    routerStore.isBookingConfirmationPage() ||
                    routerStore.isViewBookingsPage() ||
                    routerStore.isInDestinationPage() ||
                    routerStore.isPostTravelPage() ||
                    routerStore.isPreTravelPage() ||
                    layoutStore.isCancelledBookingPage ||
                    layoutStore.isAmendBookingPage
                ) {
                    // Await complete redirect and only then reload page
                    await routerStore.redirectToHomePage();
                }

                /** it is story requirement: EJH-7804 */
                location.reload();
            }
        }
    };

    public setUserDetails = async (): Promise<void> => {
        if (this.userData) {
            return;
        }

        if (this.isGettingUserInfo) {
            await when(() => this.isGettingUserInfo === false);

            return;
        }

        this.isGettingUserInfo = true;
        const resp = await UserService.getUserDetails();

        if (resp) {
            this.setIsLoggedIn(true);
            this.setUserData(resp);
        }

        runInAction(() => (this.isGettingUserInfo = false));
    };

    @action customerErrorHandler = (e: ApiError, isSignIn: boolean = false): ICustomerLoginError[] => {
        if (e?.errorCode === ApiErrors.AcountLockedBySitecoreSettings) {
            return [
                {
                    title: SitecoreDictionary.GuestDetailsErrorMessagesAccountLockedBySettings,
                    description: SitecoreDictionary.GuestDetailsErrorMessagesAccountLockedBySettingsDescription,
                },
            ];
        }

        // Show generic error about invalid credentials if sign in is failed (EJH-3825)
        if (isSignIn) {
            return [
                {
                    title: SitecoreDictionary.LoginErrorMessagesInvalidCredentials,
                    description: SitecoreDictionary.LoginErrorMessagesInvalidCredentialsDescription,
                },
            ];
        }

        if (e.innerErrors?.length) {
            const isGuestDetailsPage = this.rootStore.layoutStore.isGuestDetailsPage;

            return e.innerErrors.map(el => {
                switch (el.code) {
                    case ApiErrors.AccountLockedOrInvalidPassword:
                        return {
                            title: SitecoreDictionary.GuestDetailsErrorMessagesPasswordOrAccountLocked,
                            description: isGuestDetailsPage
                                ? SitecoreDictionary.GuestDetailsErrorMessagesPasswordOrAccountLockedDescription
                                : SitecoreDictionary.LoginErrorMessagesEmailDoesNotExistsDescription,
                        };
                    case ApiErrors.EmailDoesNotExists:
                        return {
                            title: SitecoreDictionary.GuestDetailsErrorMessagesEmailDoesNotExists,
                            description: isGuestDetailsPage
                                ? SitecoreDictionary.GuestDetailsErrorMessagesEmailDoesNotExistsDescription
                                : SitecoreDictionary.LoginErrorMessagesEmailDoesNotExistsDescription,
                        };
                    case ApiErrors.EmailAlreadyExists:
                        return {
                            title: SitecoreDictionary.GuestDetailsErrorMessagesEmailExists,
                            description: SitecoreDictionary.GuestDetailsErrorMessagesEmailExistsDescription,
                            isFatal: true,
                        };
                    default:
                        return {
                            title: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerError,
                            description: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerErrorDescription,
                        };
                }
            });
        }

        return [
            {
                title: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerError,
                description: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerErrorDescription,
            },
        ];
    };

    @action setLoginTabActive = (value: boolean): void => {
        this.isLoginTabActive = value;
    };

    @action toggleLoginPopup = (): void => {
        this.isLoginPopupShown = !this.isLoginPopupShown;
    };

    @action logoutIfNotSignedIn = async (redirectParams?: string): Promise<void> => {
        try {
            const { isTradePortal } = this.rootStore.layoutStore;
            const isLoggedIn = await UserService.getStatus(isTradePortal);

            if (!isLoggedIn) {
                await this.onLogout(true);
                this.rootStore.routerStore.redirectToLoginPage(true, redirectParams);
            }
        } catch {
            this.rootStore.routerStore.redirectToLoginPage(true);
        }
    };

    @computed get billingInfo(): IBillingInfo | undefined {
        if (!this.userData) {
            return undefined;
        }

        const { firstName, lastName, address1, address2, city, postalCode } = this.userData;

        return {
            fullName: `${firstName} ${lastName}`,
            address: address1,
            address2,
            city,
            postCode: postalCode,
        };
    }

    getSingleUsePromoCode = async (campaignId: string): Promise<string | null> => {
        const isLoggedIn = await this.checkIfUserLoggedIn();

        if (!isLoggedIn || sessionStorage.getItem(WebStorageKeys.IsUserPromoClosed)) {
            return null;
        }

        const result = await promocodeService.loadUserPromocode(campaignId);

        return result;
    };
}
