import { AxiosRequestConfig } from 'axios';

import { getEnvAll } from 'code/env';
import { mockNextAuthGetSession } from 'frontend/__mocks__/next-auth';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

import { ISession } from './auth/auth.utils';
import AxiosRequest from './request';

const url = 'url';
const body = {};

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
const mockAxiosDelete = jest.fn();
const mockAxiosPatch = jest.fn();
const mockAxiosPut = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        // @ts-ignore
        get: (...data) => mockAxiosGet(...data),
        post: (...data) => mockAxiosPost(...data),
        delete: (...data) => mockAxiosDelete(...data),
        patch: (...data) => mockAxiosPatch(...data),
        put: (...data) => mockAxiosPut(...data),
    }),
}));

jest.mock('code/env', () => ({
    getEnvAll: jest.fn().mockReturnValue({ APP_NAME: 'TradePortal' }),
}));

describe('AxiosRequest', () => {
    beforeEach(() => {
        AxiosRequest.cleanSession();
    });

    describe('buildConfig', () => {
        test('should return default config when ignoreCache is false', async () => {
            const config: AxiosRequestConfig = { url: 'test' };
            const ignoreCache = false;

            await AxiosRequest.get(url, config, ignoreCache);

            expect(mockAxiosGet).toHaveBeenCalledWith(url, config);
        });

        test('should return supplemented config when ignoreCache is true', async () => {
            const config: AxiosRequestConfig = { url: 'test', headers: { header: 'test' } };
            const expectedConfig = {
                url: 'test',
                headers: { header: 'test', 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache', Expires: '0' },
            };
            const ignoreCache = true;

            await AxiosRequest.get(url, config, ignoreCache);

            expect(mockAxiosGet).toHaveBeenCalledWith(url, expectedConfig);
        });
    });

    describe('get', () => {
        test('should return axios GET mocked value', async () => {
            const config: AxiosRequestConfig = { url: 'test' };
            const ignoreCache = false;
            const mockResponse = { data: 'data' };
            mockAxiosGet.mockResolvedValueOnce(mockResponse);

            const result = await AxiosRequest.get(url, config, ignoreCache);

            expect(result).toBe(mockResponse);
        });

        test('should catch err when smth go wrong in try-catch block during getting flow', async () => {
            (mockNextAuthGetSession as jest.Mock).mockRejectedValueOnce('Error');

            await expect(AxiosRequest.get(url)).rejects.toThrow();
        });
    });

    describe('post', () => {
        test('should return axios POST mocked value', async () => {
            const mockResponse = { data: 'data' };
            mockAxiosPost.mockResolvedValueOnce(mockResponse);

            const result = await AxiosRequest.post(url, body);

            expect(result).toBe(mockResponse);
        });

        test('should catch err when smth go wrong in try-catch block during posting flow', async () => {
            (mockNextAuthGetSession as jest.Mock).mockRejectedValueOnce('Error');

            await expect(AxiosRequest.post(url, body)).rejects.toThrow();
        });
    });

    describe('patch', () => {
        test('should return axios PATCH mocked value', async () => {
            const mockResponse = { data: 'data' };
            mockAxiosPatch.mockResolvedValueOnce(mockResponse);

            const result = await AxiosRequest.patch(url, body);

            expect(result).toBe(mockResponse);
        });

        test('should catch err when smth go wrong in try-catch block during patching flow', async () => {
            (mockNextAuthGetSession as jest.Mock).mockRejectedValueOnce('Error');

            await expect(AxiosRequest.patch(url, body)).rejects.toThrow();
        });
    });

    describe('put', () => {
        test('should return axios PUT mocked value', async () => {
            const mockResponse = { data: 'data' };
            mockAxiosPut.mockResolvedValueOnce(mockResponse);

            const result = await AxiosRequest.put(url, body);

            expect(result).toBe(mockResponse);
        });

        test('should catch err when smth go wrong in try-catch block during patching flow', async () => {
            (mockNextAuthGetSession as jest.Mock).mockRejectedValueOnce('Error');

            await expect(AxiosRequest.put(url, body)).rejects.toThrow();
        });
    });

    describe('delete', () => {
        test('should return axios DELETE mocked value', async () => {
            const mockResponse = { data: 'data' };
            mockAxiosDelete.mockResolvedValueOnce(mockResponse);

            const result = await AxiosRequest.delete(url);

            expect(result).toBe(mockResponse);
        });

        test('should catch err when smth go wrong in try-catch block during deletion flow', async () => {
            (mockNextAuthGetSession as jest.Mock).mockRejectedValueOnce('Error');

            await expect(AxiosRequest.delete(url)).rejects.toThrow();
        });
    });

    describe('updateSession', () => {
        test('should return when sessionExpiry is defined and it is less than current date', async () => {
            AxiosRequest.sessionExpiry = Infinity;

            await AxiosRequest.updateSession();

            expect(mockNextAuthGetSession).not.toHaveBeenCalled();
        });

        test('should return when not in TradePortal', async () => {
            (getEnvAll as jest.Mock).mockReturnValueOnce({ APP_NAME: 'Holidays' });

            await AxiosRequest.updateSession();

            expect(mockNextAuthGetSession).not.toHaveBeenCalled();
        });

        test('should call getSession when sessionExpiry is not defined', async () => {
            expect(AxiosRequest.session).toBeUndefined();
            expect(AxiosRequest.sessionExpiry).toBeUndefined();

            await AxiosRequest.updateSession();

            expect(mockNextAuthGetSession).toHaveBeenCalled();
        });

        test('should call getSession once when previous request still in progress', () => {
            mockNextAuthGetSession.mockReturnValueOnce(new Promise(resolve => setTimeout(resolve, 1000)));
            expect(AxiosRequest.session).toBeUndefined();
            expect(AxiosRequest.sessionExpiry).toBeUndefined();

            AxiosRequest.updateSession();
            AxiosRequest.updateSession();

            expect(mockNextAuthGetSession).toHaveBeenCalledTimes(1);
        });

        test('should set sessionExpiry to Infinity when getSession returns empty object', async () => {
            (mockNextAuthGetSession as jest.Mock).mockResolvedValueOnce({});
            expect(AxiosRequest.session).toBeUndefined();
            expect(AxiosRequest.sessionExpiry).toBeUndefined();

            await AxiosRequest.updateSession();

            expect(mockNextAuthGetSession).toHaveBeenCalled();
            expect(AxiosRequest.sessionExpiry).toBe(Infinity);
        });

        test('should set sessionExpiry and session to received values when getSession returns session object', async () => {
            const session: ISession = {
                user: {
                    name: 'User',
                    abtaNumber: '1',
                    agencyId: 'agencyId',
                    emailAddress: 'user@example.com',
                    role: TradeUserRoles.Agent,
                    consortiumId: 'consortiumId',
                    firstName: 'User',
                    lastName: 'Last Name',
                    username: 'Last Name',
                },
                accessToken: 'accessToken',
                accessTokenExp: 123,
            };
            (mockNextAuthGetSession as jest.Mock).mockResolvedValueOnce(session);
            expect(AxiosRequest.session).toBeUndefined();
            expect(AxiosRequest.sessionExpiry).toBeUndefined();

            await AxiosRequest.updateSession();

            expect(mockNextAuthGetSession).toHaveBeenCalled();
            expect(AxiosRequest.session).toBe(session);
            expect(AxiosRequest.sessionExpiry).toBe(session.accessTokenExp);
        });
    });

    describe('cleanSession', () => {
        test('should return default values to AxiosRequest static fields', () => {
            AxiosRequest.session = {};
            AxiosRequest.sessionExpiry = Infinity;
            AxiosRequest.isSessionInProgress = true;

            AxiosRequest.cleanSession();

            expect(AxiosRequest.session).toBe(undefined);
            expect(AxiosRequest.sessionExpiry).toBe(undefined);
            expect(AxiosRequest.isSessionInProgress).toBe(false);
        });
    });
});
