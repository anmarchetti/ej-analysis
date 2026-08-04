import https from 'https';

import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';

import { getEnvAll } from 'code/env';
import { SiteName } from 'models/enum/SiteName';

import { ISession } from './auth/auth.utils';
import isBackend from './isBackend';

class AxiosRequest {
    private static ignoreCacheHeaders = { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache', Expires: '0' };

    static session?: ISession = undefined;
    static sessionExpiry?: number = undefined;
    static isSessionInProgress: boolean = false;

    private static getAppName(): string {
        return getEnvAll().APP_NAME;
    }

    static async updateSession(): Promise<void> {
        if (AxiosRequest.isSessionInProgress) {
            const INTERVAL_TIME = 1000;

            await new Promise(resolve => {
                const timer = setInterval(() => {
                    if (AxiosRequest.isSessionInProgress) {
                        return;
                    }

                    resolve(true);
                    clearInterval(timer);
                }, INTERVAL_TIME);
            });

            return;
        }

        if (AxiosRequest.sessionExpiry && Date.now() < AxiosRequest.sessionExpiry) {
            return;
        }

        if (this.getAppName() !== SiteName.TradePortal) {
            return;
        }

        AxiosRequest.isSessionInProgress = true;

        try {
            const session = (await getSession()) as ISession | null;

            if (session?.accessToken) {
                AxiosRequest.session = session;
                AxiosRequest.sessionExpiry = session.accessTokenExp;
            } else {
                // this line allows you to exclude unnecessary session requests when using NOT RedHatSSO flow
                AxiosRequest.sessionExpiry = Infinity;
            }
        } finally {
            AxiosRequest.isSessionInProgress = false;
        }
    }

    static createAxiosInstance = async () => {
        const basicHeaders = { 'Content-Type': 'application/json', 'X-ej-sc-site': this.getAppName() };

        await AxiosRequest.updateSession();

        const headers = AxiosRequest.session?.accessToken
            ? { ...basicHeaders, Authorization: `Bearer ${AxiosRequest.session.accessToken}` }
            : basicHeaders;

        return Axios.create({
            withCredentials: true,
            withXSRFToken: true,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers,
        });
    };

    /**
     * GET request
     * @param url - request url
     * @param config - Axios request config
     * @param ignoreCache - should cache be disabled for request (useful for IE on same requests)
     */
    static get = async (url, config?: AxiosRequestConfig, ignoreCache?: boolean) => {
        try {
            const newConfig = AxiosRequest.buildConfig(config, ignoreCache);
            const instance = await AxiosRequest.createAxiosInstance();
            const response = await instance.get(url, newConfig);

            return response;
        } catch (e) {
            if (!isBackend() && !Axios.isCancel(e)) {
                window.errorTracking(e);
            }

            throw e;
        }
    };

    /**
     * POST request
     * @param url - request url
     * @param body - POST request body
     * @param config - Axios request config
     * @param ignoreCache - should cache be disabled for request (useful for IE on same requests)
     */
    static post = async (url, body, config?: AxiosRequestConfig, ignoreCache?: boolean) => {
        try {
            const newConfig = AxiosRequest.buildConfig(config, ignoreCache);
            const instance = await AxiosRequest.createAxiosInstance();
            const response = await instance.post(url, body, newConfig);

            return response;
        } catch (e) {
            if (!isBackend() && !Axios.isCancel(e)) {
                window.errorTracking(e);
            }

            throw e;
        }
    };

    /**
     * PUT request
     * @param url - request url
     * @param body - PUT request body
     * @param config - Axios request config
     * @param ignoreCache - should cache be disabled for request (useful for IE on same requests)
     */
    static readonly put = async (
        url: string,
        body: Record<string, any>,
        config?: AxiosRequestConfig,
        ignoreCache?: boolean,
    ): Promise<AxiosResponse<any, any>> => {
        try {
            const newConfig = AxiosRequest.buildConfig(config, ignoreCache);
            const instance = await AxiosRequest.createAxiosInstance();
            const response = await instance.put(url, body, newConfig);

            return response;
        } catch (e) {
            if (!isBackend() && !Axios.isCancel(e)) {
                window.errorTracking(e);
            }

            throw e;
        }
    };

    /**
     * PATCH request
     * @param url - request url
     * @param body - POST request body
     * @param config - Axios request config
     * @param ignoreCache - should cache be disabled for request (useful for IE on same requests)
     */
    static patch = async (url, body, config?: AxiosRequestConfig, ignoreCache?: boolean) => {
        try {
            const newConfig = AxiosRequest.buildConfig(config, ignoreCache);
            const instance = await AxiosRequest.createAxiosInstance();
            const response = await instance.patch(url, body, newConfig);

            return response;
        } catch (e) {
            if (!isBackend() && !Axios.isCancel(e)) {
                window.errorTracking(e);
            }

            throw e;
        }
    };

    /**
     * DELETE request
     * @param url - request url
     * @param config - Axios request config
     */
    static delete = async (url, config?: AxiosRequestConfig) => {
        try {
            const instance = await AxiosRequest.createAxiosInstance();
            const response = await instance.delete(url, config);

            return response;
        } catch (e) {
            if (!isBackend() && !Axios.isCancel(e)) {
                window.errorTracking(e);
            }

            throw e;
        }
    };

    private static buildConfig(config?: AxiosRequestConfig, ignoreCache?: boolean) {
        if (ignoreCache) {
            config = { ...(config || {}) };
            config.headers = {
                ...(config.headers || {}),
                ...AxiosRequest.ignoreCacheHeaders,
            };
        }

        return config;
    }

    static cleanSession() {
        AxiosRequest.session = undefined;
        AxiosRequest.sessionExpiry = undefined;
        AxiosRequest.isSessionInProgress = false;
    }
}

export default AxiosRequest;
