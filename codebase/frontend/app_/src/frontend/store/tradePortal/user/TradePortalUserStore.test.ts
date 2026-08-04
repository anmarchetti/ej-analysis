import { mockNextAuthGetSession, mockNextAuthSignIn, mockNextAuthSignOut } from 'frontend/__mocks__/next-auth';
import { logger } from 'frontend/services/logging';
import { UserService } from 'frontend/services/user.service';
import { ISession } from 'frontend/utils/auth/auth.utils';
import { IAgentInfo } from 'models/data/tradePortal/IAgentInfo';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

import { LOGIN_GENERIC_EVENT_PARAMS, TradePortalUserStore } from './TradePortalUserStore';

jest.mock('frontend/services/logging');

Object.defineProperty(global, 'location', {
    configurable: true,
    value: {
        reload: jest.fn(),
    },
});

Object.defineProperty(window, 'errorTracking', {
    value: jest.fn(),
});

let TradePortaluserStore: TradePortalUserStore;

describe('<TradePortalUserStore />', () => {
    const agentInfo: IAgentInfo = {
        name: 'Agent',
        number: '123456',
        ref: '',
    };
    const signInProps = ['test', 'test', 'test'] as const;
    const rootStore = {
        viewBookingStore: {
            clearGuestBookingInfo: jest.fn(),
        },
        trackingStore: {
            trackAccountEvent: jest.fn(),
            trackEventWithParams: jest.fn(),
        },
        guestDetailsStore: {
            removeGuestDetailsFromSessionStorage: jest.fn(),
        },
        routerStore: {
            isViewBookingPage: jest.fn(),
            isBookingConfirmationPage: jest.fn(),
            isViewBookingsPage: jest.fn(),
            redirectToHomePage: jest.fn(),
            redirectTo: jest.fn(),
        },
        layoutStore: {
            isExtrasPage: false,
        },
        engageStore: { sendIdentityEvent: jest.fn() },
    } as any;

    beforeEach(() => {
        TradePortaluserStore = new TradePortalUserStore(rootStore);
    });

    describe('setAgentInfo', () => {
        it('should set userData from argument', () => {
            expect(TradePortaluserStore.agentInfo).toBeNull();

            TradePortaluserStore.setAgentInfo(agentInfo);

            expect(TradePortaluserStore.agentInfo).toEqual(agentInfo);
        });
    });

    describe('Clear store', () => {
        it('It should clear store values', () => {
            TradePortaluserStore.setAgentInfo({} as any);
            TradePortaluserStore.setIsLoggedIn(true);

            jest.spyOn(TradePortaluserStore.loginAgent, 'cleanUpModel');
            jest.spyOn(TradePortaluserStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');

            TradePortaluserStore.clearUserStore();

            expect(TradePortaluserStore.loginAgent.cleanUpModel).toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(TradePortaluserStore.agentInfo).toBeNull();
            expect(TradePortaluserStore.isLoggedIn).toBeFalsy();
        });
    });

    describe('onLogin', () => {
        it('should logout current user and log in new user', async () => {
            TradePortaluserStore.setIsLoggedIn(true);

            TradePortaluserStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            TradePortaluserStore.signIn = jest.fn().mockReturnValue(Promise.resolve());
            jest.spyOn(TradePortaluserStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(TradePortaluserStore.rootStore.routerStore, 'redirectTo');

            await TradePortaluserStore.onLogin();

            expect(TradePortaluserStore.onLogout).toHaveBeenCalled();
            expect(TradePortaluserStore.signIn).toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.routerStore.redirectTo).toHaveBeenCalled();
        });

        it('should log in new user without logout current when logoutIfLoggedIn false', async () => {
            const logoutIfLoggedIn = false;

            TradePortaluserStore.setIsLoggedIn(true);

            TradePortaluserStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            TradePortaluserStore.signIn = jest.fn().mockReturnValue(Promise.resolve());

            await TradePortaluserStore.onLogin(logoutIfLoggedIn);

            expect(TradePortaluserStore.onLogout).not.toHaveBeenCalled();
            expect(TradePortaluserStore.signIn).toHaveBeenCalled();
        });

        it('should log in user', async () => {
            TradePortaluserStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            TradePortaluserStore.signIn = jest.fn().mockReturnValue(Promise.resolve());
            jest.spyOn(TradePortaluserStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(TradePortaluserStore.rootStore.routerStore, 'redirectTo');

            await TradePortaluserStore.onLogin();

            expect(TradePortaluserStore.onLogout).not.toHaveBeenCalled();
            expect(TradePortaluserStore.signIn).toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.routerStore.redirectTo).toHaveBeenCalled();
        });

        it('should set customer login error if some errors appear', async () => {
            TradePortaluserStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            TradePortaluserStore.signIn = jest.fn().mockReturnValue(Promise.reject());
            jest.spyOn(TradePortaluserStore.rootStore.viewBookingStore, 'clearGuestBookingInfo');
            jest.spyOn(TradePortaluserStore.rootStore.routerStore, 'redirectTo');

            await TradePortaluserStore.onLogin();

            expect(TradePortaluserStore.onLogout).not.toHaveBeenCalled();
            expect(TradePortaluserStore.signIn).toHaveBeenCalled();
            expect(TradePortaluserStore.loginAgent.errors.length).toEqual(1);
            expect(TradePortaluserStore.loginAgent.errors[0].title).toEqual('Login.ErrorMessages.InvalidCredentials');
            expect(TradePortaluserStore.loginAgent.errors[0].description).toEqual(
                'Login.ErrorMessages.InvalidCredentialsDescription',
            );
        });
    });

    describe('signIn', () => {
        it('should sign in user', async () => {
            UserService.logInAgent = jest.fn().mockResolvedValue(agentInfo);

            await TradePortaluserStore.signIn(...signInProps);

            expect(UserService.logInAgent).toHaveBeenCalledWith(...signInProps);
            expect(TradePortaluserStore.isLoggedIn).toBeTruthy();
            expect(TradePortaluserStore.agentInfo).toEqual(agentInfo);
            expect(TradePortaluserStore.rootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                LOGIN_GENERIC_EVENT_PARAMS,
                {
                    destinationUrl: 'null',
                    genericValue1: 'test',
                    genericValue2: 'null',
                    genericValue3: 'null',
                    genericValue4: 'null',
                },
            );
        });

        it('should NOT sign in user if errors appear', async () => {
            UserService.logIn = jest.fn().mockRejectedValueOnce('Error');

            try {
                await TradePortaluserStore.signIn(...signInProps);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'Failed to sign in',
                    }),
                );
            }
        });
    });

    describe('setUserLoggedIn', () => {
        it('should set true to logging state', async () => {
            const mockSsoAuthenticated = true;
            TradePortaluserStore.rootStore.layoutStore = { ...rootStore.layoutStore, isTradePortal: true };

            const spy = jest.spyOn(TradePortaluserStore, 'setIsLoggedIn');
            UserService.getStatus = jest.fn();

            await TradePortaluserStore.setUserLoggedIn(mockSsoAuthenticated);

            expect(UserService.getStatus).not.toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith(true);
        });

        it('should updateAgentInfoData on Trade Portal store with session data for SSO session', async () => {
            rootStore.layoutStore = { ...rootStore.layoutStore, isTradePortal: true };

            const spy = jest.spyOn(TradePortaluserStore, 'updateAgentInfoDataForSSO');

            await TradePortaluserStore.setUserLoggedIn(true);

            expect(spy).toHaveBeenCalled();
        });

        it('should not updateAgentInfoDataForSSO on Trade Portal store with session data for non-SSO session', async () => {
            rootStore.layoutStore = { ...rootStore.layoutStore, isTradePortal: false };

            const spy = jest.spyOn(TradePortaluserStore, 'updateAgentInfoDataForSSO');

            await TradePortaluserStore.setUserLoggedIn();

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('onLogout', () => {
        it('should correctly logout', async () => {
            UserService.logOutAgent = jest.fn().mockReturnValue(Promise.resolve());
            const spy = jest.spyOn(TradePortaluserStore, 'clearUserStore');

            await TradePortaluserStore.onLogout();

            expect(UserService.logOutAgent).toHaveBeenCalled();
            expect(mockNextAuthSignOut).toHaveBeenCalled();
            expect(location.reload).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        it('should NOT call location.reload when isSoftLogout param is truthy', async () => {
            UserService.logOutAgent = jest.fn().mockReturnValue(Promise.resolve());

            await TradePortaluserStore.onLogout(true);

            expect(location.reload).not.toHaveBeenCalled();
        });
    });

    describe('updateAgentInfoData', () => {
        it('should call updateUserData when it gets session object', async () => {
            const mockSessionToken = { authenticated: true };
            const spy = jest.spyOn(TradePortaluserStore, 'updateUserData');
            mockNextAuthGetSession.mockResolvedValueOnce(mockSessionToken);
            await TradePortaluserStore.updateAgentInfoDataForSSO();

            expect(mockNextAuthGetSession).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith(mockSessionToken);
        });

        it('should NOT call updateUserData when session object is null', async () => {
            const mockSessionToken = null;
            const spy = jest.spyOn(TradePortaluserStore, 'updateUserData');
            mockNextAuthGetSession.mockResolvedValueOnce(mockSessionToken);
            await TradePortaluserStore.updateAgentInfoDataForSSO();

            expect(mockNextAuthGetSession).toHaveBeenCalled();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('onSSOLogin', () => {
        const redirectUrl = 'redirectUrl';

        beforeEach(() => {
            TradePortaluserStore.onLogout = jest.fn().mockReturnValue(Promise.resolve());
            mockNextAuthSignIn.mockResolvedValue({ data: 'data' });
        });

        it('should logout current user and log in with SSO new user', async () => {
            TradePortaluserStore.setIsLoggedIn(true);

            await TradePortaluserStore.onSSOLogin(redirectUrl);

            expect(TradePortaluserStore.onLogout).toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(mockNextAuthSignIn).toHaveBeenCalled();
        });

        it('should log in with SSO new user without logout when logoutIfLoggedIn false', async () => {
            TradePortaluserStore.setIsLoggedIn(true);

            await TradePortaluserStore.onSSOLogin(redirectUrl, false);

            expect(TradePortaluserStore.onLogout).not.toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(mockNextAuthSignIn).toHaveBeenCalled();
        });

        it('should set customer login error if some errors appear during log in with SSO', async () => {
            mockNextAuthSignIn.mockRejectedValue(new Error('test'));
            await TradePortaluserStore.onSSOLogin(redirectUrl);

            expect(TradePortaluserStore.onLogout).not.toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.viewBookingStore.clearGuestBookingInfo).toHaveBeenCalled();
            expect(mockNextAuthSignIn).toHaveBeenCalled();

            const { errors } = TradePortaluserStore.loginAgent;

            expect(errors.length).toEqual(1);
            expect(errors[0].title).toEqual('Login.ErrorMessages.InvalidCredentials');
            expect(errors[0].description).toEqual('Login.ErrorMessages.InvalidCredentialsDescription');
        });
    });

    describe('updateUserData', () => {
        it('should set agent info and redirect to local url when session user is defined', () => {
            const session: ISession = {
                user: {
                    abtaNumber: '123',
                    name: 'Test User',
                    agencyId: 'ref123',
                    consortiumId: 'consortium123',
                    emailAddress: 'test@email.com',
                    lastName: 'Test',
                    firstName: 'User',
                    username: 'testuser',
                    role: TradeUserRoles.Agent,
                },
            };
            const spySetIsLoggedIn = jest.spyOn(TradePortaluserStore, 'setIsLoggedIn');
            const spySetAgentInfo = jest.spyOn(TradePortaluserStore, 'setAgentInfo');

            TradePortaluserStore.updateUserData(session);

            expect(spySetIsLoggedIn).toHaveBeenCalledWith(true);
            expect(spySetAgentInfo).toHaveBeenCalledWith({
                number: session.user!.abtaNumber,
                name: session.user!.name,
                ref: session.user!.agencyId,
                role: session.user!.role,
            });
        });

        it('should return without any calls when session user is not defined', () => {
            const spySetIsLoggedIn = jest.spyOn(TradePortaluserStore, 'setIsLoggedIn');
            const spySetAgentInfo = jest.spyOn(TradePortaluserStore, 'setAgentInfo');

            TradePortaluserStore.updateUserData({});

            expect(spySetIsLoggedIn).not.toHaveBeenCalled();
            expect(spySetAgentInfo).not.toHaveBeenCalled();
            expect(
                TradePortaluserStore.rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage,
            ).not.toHaveBeenCalled();
            expect(TradePortaluserStore.rootStore.routerStore.redirectTo).not.toHaveBeenCalled();
        });
    });
});
