import { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

import { tradePortalWebApiUrls, userManagementApiUrls, webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { IAgentInfo } from 'models/data/tradePortal/IAgentInfo';

import { logger } from './logging';

export interface IRegisterBody {
    customer: ILoginInfo;
    password: string;
    rememberMe: boolean;
}

interface IUMUserInfo {
    agencyLogo: string;
    consortiumLogo: string;
}

export class UserService {
    static logIn = async (
        email: string,
        password: string,
        rememberMe: boolean,
        captcha?: string,
    ): Promise<ILoginInfo> => {
        const result = await AxiosRequest.post(webApiUrls.session.login(), {
            email,
            password,
            rememberMe,
            captcha: captcha || '',
        });

        return result.data;
    };

    static logInAgent = async (number: string, password: string, ref: string): Promise<IAgentInfo> => {
        const result = await AxiosRequest.post(tradePortalWebApiUrls.session.login(), {
            number,
            password,
            ref,
        });

        return result.data;
    };

    static logOut = async (): Promise<AxiosResponse<any>> => {
        try {
            return await AxiosRequest.post(webApiUrls.session.logout(), {});
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    static logOutAgent = async (): Promise<void> => {
        try {
            await AxiosRequest.post(tradePortalWebApiUrls.session.logout(), {});
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    static register = async (
        customer: ILoginInfo,
        password: string,
        rememberMe: boolean = false,
    ): Promise<ILoginInfo> => {
        const requestBody = {
            customer,
            password,
            rememberMe,
        };
        const result = await AxiosRequest.post(webApiUrls.session.register(), requestBody);

        return result.data;
    };

    static getUserDetails = async (): Promise<Nullable<ILoginInfo>> => {
        try {
            const res = await AxiosRequest.get(webApiUrls.session.userDetails(), undefined, true);

            return res?.data ? res.data : null;
        } catch (e) {
            if (e.response?.status !== 401) {
                logger.error({ e });
            }

            return null;
        }
    };

    static verifyEmail = async (email: string, cancelSource?: CancelTokenSource): Promise<boolean> => {
        try {
            const result = await AxiosRequest.get(
                webApiUrls.session.verifyEmail(email),
                { cancelToken: cancelSource ? cancelSource.token : cancelSource },
                true,
            );

            return result.data === true;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    static resetPassword = async (email: string): Promise<AxiosResponse<any>> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.session.resetPassword(email), {});

            return result;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    static getStatus = async (isTradePortal: boolean, config?: AxiosRequestConfig): Promise<boolean> => {
        const targetApi = isTradePortal ? tradePortalWebApiUrls : webApiUrls;

        try {
            const result = await AxiosRequest.get(targetApi.session.status(), config, true);

            return !!result.data?.signedIn;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    static getUMUserInfo = async (token: string): Promise<IUMUserInfo> => {
        try {
            const res = await AxiosRequest.get(userManagementApiUrls.currentUser(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST',
                    Accept: '*/*',
                },
            });

            return res.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    /**
     * Unsubscribe from marketing research
     */
    static marketingUnsubscribe = async (email: string, encEmail: string, source?: string): Promise<boolean> => {
        try {
            await AxiosRequest.post(webApiUrls.marketing.unsubscribe(), { email, encEmail, source });

            return true;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    /**
     * Get decrypted email from encEmail
     */
    static decryptEncEmail = async (encEmail: string): Promise<string> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.marketing.decryptEncEmail(encEmail));

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };
}
