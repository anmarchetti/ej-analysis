import { GetServerSidePropsContext } from 'next';
import { JWT } from 'next-auth/jwt';

import { envAll } from 'code/env';
import { UserService } from 'frontend/services/user.service';
import { getUserRoleFromRolesArray } from 'frontend/utils/auth/tradeRoles.utils';
import AxiosRequest from 'frontend/utils/request';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

export const ACCESS_EXPIRY_TIMEOUT_MS = 15;
export const ONE_SECOND_IN_MS = 1000;

interface ICustomToken extends JWT {
    accessToken: string;
    accessTokenExp: number;
    refreshToken: string;
    refreshTokenExp: number;
}

export interface IDToken extends JWT {
    abta: string;
    agency_id: string;
    consortium_id: string;
    email: string;
    family_name: string;
    given_name: string;
    name: string;
    preferred_username: string;
    roles: string[];
}

export interface ISession {
    accessToken?: string;
    accessTokenExp?: number;
    error?: boolean;
    user?: {
        abtaNumber: string;
        agencyId: string;
        consortiumId: string;
        emailAddress: string;
        firstName: string;
        lastName: string;
        name: string;
        username: string;
        role?: TradeUserRoles;
    };
}

export const isAuthenticated = async (
    session: ISession | null,
    req: GetServerSidePropsContext['req'],
): Promise<boolean> => {
    if (!session) {
        const config = req.headers.cookie ? { headers: { Cookie: req.headers.cookie } } : undefined;

        return await UserService.getStatus(true, config);
    }

    if (session.error) {
        return false;
    }

    return true;
};

export const refreshAccessToken = async (token: ICustomToken): Promise<ICustomToken> => {
    try {
        if (Date.now() > token.refreshTokenExp) throw Error;

        const requestBody = {
            client_id: envAll.REDHATSSO_CLIENTID,
            client_secret: envAll.REDHATSSO_CLIENT_SECRET,
            grant_type: ['refresh_token'],
            refresh_token: token.refreshToken,
        };
        const formattedRequestBody = Object.keys(requestBody)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(requestBody[key]))
            .join('&');

        const refreshRequestURL = `${envAll.REDHATSSO_ISSUER}/protocol/openid-connect/token`;

        const result = await AxiosRequest.post(refreshRequestURL, formattedRequestBody, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
        });

        const tokenData = result.data;

        return {
            ...token,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            accessTokenExp: Date.now() + (tokenData.expires_in - ACCESS_EXPIRY_TIMEOUT_MS) * ONE_SECOND_IN_MS,
            refreshTokenExp: Date.now() + (tokenData.refresh_expires_in - ACCESS_EXPIRY_TIMEOUT_MS) * ONE_SECOND_IN_MS,
            error: false,
        };
    } catch (error) {
        return {
            ...token,
            error: true,
        };
    }
};

const decodeJWT = (token: string): IDToken => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

export const getUserDataFromIdToken = (idToken: string): ISession['user'] => {
    const token = decodeJWT(idToken);

    return {
        abtaNumber: token.abta,
        agencyId: token.agency_id,
        consortiumId: token.consortium_id,
        emailAddress: token.email,
        lastName: token.family_name,
        firstName: token.given_name,
        name: token.name,
        username: token.preferred_username,
        role: getUserRoleFromRolesArray(token.roles),
    };
};
