import { GetServerSidePropsContext } from 'next';

import { envAll } from 'code/env';
import { UserService } from 'frontend/services/user.service';
import {
    getUserDataFromIdToken,
    IDToken,
    isAuthenticated,
    ISession,
    refreshAccessToken,
} from 'frontend/utils/auth/auth.utils';
import AxiosRequest from 'frontend/utils/request';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

jest.mock('frontend/services/user.service', () => ({
    UserService: {
        getStatus: jest.fn(),
    },
}));

jest.mock('frontend/utils/request', () => ({
    post: jest.fn(),
}));

jest.mock('code/env', () => ({
    envAll: {
        REDHATSSO_CLIENTID: 'test-client-id',
        REDHATSSO_CLIENT_SECRET: 'test-client-secret',
        REDHATSSO_ISSUER: 'https://test-issuer',
    },
}));

const mockUser = {
    abtaNumber: '123',
    name: 'Test User',
    agencyId: 'ref123',
    consortiumId: 'consortium123',
    emailAddress: 'test@email.com',
    lastName: 'Test',
    firstName: 'User',
    username: 'testuser',
    role: TradeUserRoles.Agent,
};

describe('isAuthenticated', () => {
    it('should return false if session is not provided', async () => {
        const req = { headers: { cookie: 'some-wrong-cookie' } } as GetServerSidePropsContext['req'];
        (UserService.getStatus as jest.Mock).mockResolvedValueOnce(false);

        const result = await isAuthenticated(null, req);

        expect(result).toBeFalsy();
        expect(UserService.getStatus).toHaveBeenCalledWith(true, { headers: { Cookie: 'some-wrong-cookie' } });
    });

    it('should return false if session has error', async () => {
        const session: ISession = { user: { ...mockUser, abtaNumber: '', name: '', agencyId: '' }, error: true };

        const result = await isAuthenticated(session, {} as any);

        expect(result).toBeFalsy();
    });

    it('should return true if session is valid', async () => {
        const session: ISession = { user: { ...mockUser, abtaNumber: '123', name: 'Test User', agencyId: 'ref123' } };

        const result = await isAuthenticated(session, {} as any);

        expect(result).toBeTruthy();
    });
});

const mockToken = {
    accessToken: 'access-token',
    accessTokenExp: Date.now() + 10000,
    refreshToken: 'refresh-token',
    refreshTokenExp: Date.now() + 10000,
};

describe('refreshAccessToken', () => {
    const mockRefreshExpiresIn = 7200;
    const mockAccessExpiresIn = 3600;
    const refreshMockToken = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: mockAccessExpiresIn,
        refresh_expires_in: mockRefreshExpiresIn,
    };

    it('should return old token with error set if refresh token is expired', async () => {
        const mockRefreshTokenExp = Date.now() - 10000;
        const token = { ...mockToken, refreshTokenExp: mockRefreshTokenExp };

        await expect(await refreshAccessToken(token)).toMatchObject({
            ...mockToken,
            refreshTokenExp: mockRefreshTokenExp,
            error: true,
        });
    });

    it('should return new token data on successful refresh', async () => {
        (AxiosRequest.post as jest.Mock).mockResolvedValueOnce({ data: refreshMockToken });

        const result = await refreshAccessToken(mockToken);

        expect(result).toMatchObject({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        });
        expect(AxiosRequest.post).toHaveBeenCalledWith(
            `${envAll.REDHATSSO_ISSUER}/protocol/openid-connect/token`,
            expect.any(String),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' } },
        );
    });

    it('should clear error on successful refresh', async () => {
        (AxiosRequest.post as jest.Mock).mockResolvedValueOnce({ data: refreshMockToken });
        const token = { ...mockToken, error: true };

        const result = await refreshAccessToken(token);

        expect(result.error).toBeFalsy();
    });

    it('should return token with error on refresh failure', async () => {
        (AxiosRequest.post as jest.Mock).mockRejectedValueOnce(new Error('Failed to refresh'));
        const token = {
            ...mockToken,
            refreshToken: 'invalid-refresh-token',
            refreshTokenExp: Date.now() + 10000,
        };

        const result = await refreshAccessToken(token);

        expect(result.error).toBeTruthy();
    });
});

const createBase64Payload = (payload: object): string => Buffer.from(JSON.stringify(payload)).toString('base64');
const createMockIDToken = (payload: object): string => `mockHeader.${createBase64Payload(payload)}.mockSignature`;

describe('getUserDataFromIdToken', () => {
    it('should return user data from id token', () => {
        const idToken: IDToken = {
            abta: '123',
            agency_id: 'ref123',
            consortium_id: 'consortium123',
            email: 'email',
            family_name: 'Test',
            given_name: 'User',
            preferred_username: 'testuser',
            name: 'Test User',
            roles: ['agent'],
        };

        const mockIDToken = createMockIDToken(idToken);
        const result = getUserDataFromIdToken(mockIDToken);

        expect(result).toMatchObject({
            abtaNumber: '123',
            agencyId: 'ref123',
            consortiumId: 'consortium123',
            emailAddress: 'email',
            lastName: 'Test',
            firstName: 'User',
            name: 'Test User',
            username: 'testuser',
        });
    });
});
