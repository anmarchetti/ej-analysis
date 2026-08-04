import { action, makeObservable, observable, runInAction, when } from 'mobx';
import { getSession, signIn, signOut } from 'next-auth/react';

import { logger } from 'frontend/services/logging';
import { UserService } from 'frontend/services/user.service';
import { BaseUserStore } from 'frontend/store/base/user/BaseUserStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { ISession } from 'frontend/utils/auth/auth.utils';
import { ApiError } from 'models/data/ApiError';
import { IAgentInfo } from 'models/data/tradePortal/IAgentInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';

import { LoginAgent } from './LoginAgent/LoginAgent';

export const LOGIN_GENERIC_EVENT_PARAMS = {
    eventAction: EventActions.LoginSuccessfully,
    eventCategory: EventCategories.Login,
    eventLabel: 'Log in clicked',
    eventType: EventTypes.Interaction,
    eventValue: 'null',
};

export class TradePortalUserStore extends BaseUserStore {
    @observable loginAgent: LoginAgent = new LoginAgent();
    @observable agentInfo: Nullable<IAgentInfo> = null;

    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @action setAgentInfo = (value: IAgentInfo): void => {
        this.agentInfo = value;
    };

    @action clearUserStore = (): void => {
        this.loginAgent.cleanUpModel();
        this.rootStore.viewBookingStore.clearGuestBookingInfo();
        this.agentInfo = null;
        this.isLoggedIn = false;
    };

    public updateUserData = (session: ISession): void => {
        if (!session?.user) {
            return;
        }

        this.setIsLoggedIn(true);
        this.setAgentInfo({
            number: session.user.abtaNumber || '',
            name: session.user.name,
            ref: session.user.agencyId,
            role: session.user.role,
        });
    };

    public updateAgentInfoDataForSSO = async (): Promise<void> => {
        try {
            const session = (await getSession()) as ISession | null;

            if (session) {
                this.updateUserData(session);
            }
        } catch (error) {
            this.clearUserStore();
        }
    };

    public setUserLoggedIn = async (ssoAuthenticated?: boolean): Promise<void> => {
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
            const isLoggedIn = ssoAuthenticated || (await UserService.getStatus(true));

            this.setIsLoggedIn(isLoggedIn);

            if (ssoAuthenticated) {
                // if user is authenticated by SSO we update agent info from SSO session token
                await this.updateAgentInfoDataForSSO();
            }
        } catch (e) {
            this.setIsLoggedIn(false);
        } finally {
            this.setIsGettingUserStatus(false);
        }
    };

    public onSSOLogin = async (redirectUrl: string, logoutIfLoggedIn = true): Promise<void> => {
        try {
            this.setIsLoggingIn(true);

            if (this.isLoggedIn && logoutIfLoggedIn) {
                await this.onLogout();
            }

            this.rootStore.viewBookingStore.clearGuestBookingInfo();
            await signIn('redhat-sso', { callbackUrl: redirectUrl });
        } catch (e) {
            runInAction(() => {
                // Show generic error about invalid credentials if sign in is failed
                this.loginAgent.errors = [
                    {
                        title: SitecoreDictionary.LoginErrorMessagesInvalidCredentials,
                        description: SitecoreDictionary.LoginErrorMessagesInvalidCredentialsDescription,
                    },
                ];
            });
        } finally {
            this.setIsLoggingIn(false);
        }
    };

    public onLogin = async (logoutIfLoggedIn = true, afterSignInAction?: () => void): Promise<void> => {
        try {
            this.setIsLoggingIn(true);

            if (this.isLoggedIn && logoutIfLoggedIn) {
                await this.onLogout();
            }

            await this.signIn(
                this.loginAgent.agentNumber,
                this.loginAgent.password,
                this.loginAgent.consultantName,
                afterSignInAction,
            );

            this.rootStore.viewBookingStore.clearGuestBookingInfo();
            this.rootStore.routerStore.redirectTo(this.redirectUrlLocal);
        } catch (e) {
            runInAction(() => {
                // Show generic error about invalid credentials if sign in is failed
                this.loginAgent.errors = [
                    {
                        title: SitecoreDictionary.LoginErrorMessagesInvalidCredentials,
                        description: SitecoreDictionary.LoginErrorMessagesInvalidCredentialsDescription,
                    },
                ];
            });
        } finally {
            this.setIsLoggingIn(false);
        }
    };

    @action public signIn = async (
        agentNumber: string,
        password: string,
        consultantName: string,
        afterSignInAction?: () => void,
    ): Promise<void> => {
        try {
            const data = await UserService.logInAgent(agentNumber, password, consultantName);

            this.setIsLoggedIn(true);
            this.setAgentInfo(data);
            afterSignInAction?.();

            /** Clean up guest details session info if user was logged in */
            this.rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage();

            this.rootStore.trackingStore.trackEventWithParams(EventTypes.GenericEvent, LOGIN_GENERIC_EVENT_PARAMS, {
                ...GENERIC_CUSTOM_PARAMS_EMPTY,
                genericValue1: agentNumber,
            });
        } catch (e) {
            logger.error({
                e,
                message: 'Failed to sign in',
            });
            const error = new ApiError(e);
            this.rootStore.trackingStore.trackAccountEvent(EventTypes.UnsuccessfulLogin);
            throw error;
        }
    };

    public onLogout = async (isSoftLogout = false): Promise<void> => {
        try {
            if (this.isLoggingOut) {
                await when(() => this.isLoggingOut === false);

                return;
            }

            this.setIsLoggingOut(true);
            await UserService.logOutAgent();
            await signOut({ redirect: false });
            this.clearUserStore();
        } finally {
            this.setIsLoggingOut(false);

            /** it is story requirement: EJH-7804 */
            if (!isSoftLogout) {
                location.reload();
            }
        }
    };
}
