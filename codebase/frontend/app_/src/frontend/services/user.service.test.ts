import { AxiosError } from 'axios';

import { tradePortalWebApiUrls, webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';

import { UserService } from './user.service';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('UserService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('logIn', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const email = 'email';
            const password = 'password';
            const rememberMe = true;
            const captcha = 'captcha';
            await UserService.logIn(email, password, rememberMe, captcha);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.session.login(),
                {
                    email,
                    password,
                    rememberMe,
                    captcha,
                },
                undefined,
            );
        });
    });

    describe('logInAgent', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const number = 'number';
            const password = 'password';
            const ref = 'ref';

            await UserService.logInAgent(number, password, ref);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                tradePortalWebApiUrls.session.login(),
                {
                    number,
                    password,
                    ref,
                },
                undefined,
            );
        });
    });

    describe('logOut', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await UserService.logOut();

            expect(mockAxiosPost).toHaveBeenCalledWith(webApiUrls.session.logout(), {}, undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.logOut();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('logOutAgent', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await UserService.logOutAgent();

            expect(mockAxiosPost).toHaveBeenCalledWith(tradePortalWebApiUrls.session.logout(), {}, undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.logOutAgent();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('register', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const customer = {} as any;
            const password = 'password';
            const rememberMe = false;
            await UserService.register(customer, password, rememberMe);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.session.register(),
                {
                    customer,
                    password,
                    rememberMe,
                },
                undefined,
            );
        });
    });

    describe('getUserDetails', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const result = await UserService.getUserDetails();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.session.userDetails(), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
            expect(result).toBe('result');
        });

        it('should call axios get with correct data and return null if data is not provided in response', async () => {
            mockAxiosGet.mockResolvedValueOnce({});
            const result = await UserService.getUserDetails();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.session.userDetails(), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
            expect(result).toBe(null);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.getUserDetails();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('verifyEmail', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const email = 'email';
            const cancelSource = { token: 'token' } as any;
            await UserService.verifyEmail(email, cancelSource);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.session.verifyEmail(email), {
                cancelToken: 'token',
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.verifyEmail('email');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('resetPassword', () => {
        it('should call axios post with correct data', async () => {
            const mockData = { data: 'result' };
            mockAxiosPost.mockResolvedValueOnce(mockData);
            const email = 'email';
            const response = await UserService.resetPassword(email);

            expect(mockAxiosPost).toHaveBeenCalledWith(webApiUrls.session.resetPassword(email), {}, undefined);
            expect(response).toBe(mockData);
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.resetPassword('email');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getStatus', () => {
        it('should call axios get with correct trade portal data when is trade portal and return signedIn status', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: { signedIn: true } });
            const result = await UserService.getStatus(true, {});

            expect(mockAxiosGet).toHaveBeenCalledWith('http://test/api/v1.0/trade-portal/account/status', {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
            expect(result).toBe(true);
        });

        it('should call axios and return false if signedIn status is not in the response', async () => {
            mockAxiosGet.mockResolvedValueOnce({});
            const result = await UserService.getStatus(true, {});

            expect(mockAxiosGet).toHaveBeenCalledWith('http://test/api/v1.0/trade-portal/account/status', {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
            expect(result).toBe(false);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            try {
                await UserService.getStatus(true);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });

        it('should call axios get with correct data when is NOT trade portal', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await UserService.getStatus(false, {});

            expect(mockAxiosGet).toHaveBeenCalledWith('http://test/api/v1.0/account/status', {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });
    });

    describe('getUMUserInfo', () => {
        it('should call axios get with passed token', async () => {
            const mockData = { data: 'result' };
            const mockToken = 'token';
            mockAxiosGet.mockResolvedValueOnce(mockData);
            const response = await UserService.getUMUserInfo(mockToken);

            expect(mockAxiosGet).toHaveBeenCalledWith('http://test/user-management-api/v1/users/current', {
                headers: {
                    Authorization: `Bearer ${mockToken}`,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST',
                    Accept: '*/*',
                },
            });
            expect(response).toBe(mockData.data);
        });
    });

    describe('marketingUnsubscribe', () => {
        it('should call axios poat with correct data', async () => {
            const email = 'email';
            const encEmail = 'encEmail';
            const source = 'source';
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await UserService.marketingUnsubscribe(email, encEmail, source);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.marketing.unsubscribe(),
                { email, encEmail, source },
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.marketingUnsubscribe('email', 'encemail');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('decryptEncEmail', () => {
        it('should call axios poat with correct data', async () => {
            const encEmail = 'encEmail';
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await UserService.decryptEncEmail(encEmail);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.marketing.decryptEncEmail(encEmail), undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await UserService.decryptEncEmail('encemail');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
