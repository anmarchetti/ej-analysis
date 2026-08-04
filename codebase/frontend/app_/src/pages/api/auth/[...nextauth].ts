import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

import { envAll } from 'code/env';
import {
    ACCESS_EXPIRY_TIMEOUT_MS,
    getUserDataFromIdToken,
    ONE_SECOND_IN_MS,
    refreshAccessToken,
} from 'frontend/utils/auth/auth.utils';

const areCookiesSecure = process.env.NODE_ENV === 'production';
const cookiePrefix = areCookiesSecure ? '__Secure-' : '';
const MAX_SESSION_AGE = 1800; // 30 minutes

const cookiesOptions = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: areCookiesSecure,
    domain: '.' + new URL(process.env.NEXTAUTH_URL as string).hostname,
};

export const authOptions = {
    providers: [
        KeycloakProvider({
            id: 'redhat-sso',
            checks: ['none'],
            clientId: envAll.REDHATSSO_CLIENTID,
            clientSecret: envAll.REDHATSSO_CLIENT_SECRET,
            issuer: envAll.REDHATSSO_ISSUER,
        }),
    ],
    session: {
        maxAge: MAX_SESSION_AGE,
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                const user = getUserDataFromIdToken(account.id_token);
                token.user = user;
                token.accessToken = account.access_token;
                token.accessTokenExp = account.expires_at - ACCESS_EXPIRY_TIMEOUT_MS * ONE_SECOND_IN_MS;
                token.refreshToken = account.refresh_token;
                token.refreshTokenExp =
                    Date.now() + (account.refresh_expires_in - ACCESS_EXPIRY_TIMEOUT_MS) * ONE_SECOND_IN_MS;
            }

            if (Date.now() < token.accessTokenExp) {
                return token;
            }

            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            if (token) {
                session.accessToken = token.accessToken;
                session.accessTokenExp = token.accessTokenExp;
                session.user = { ...session.user, ...token.user };
                session.error = token.error;
            }

            return session;
        },
        async redirect({ url, baseUrl }) {
            if (process.env.REDHATSSO_REDIRECT_URL) return process.env.REDHATSSO_REDIRECT_URL;
            else if (url.startsWith('/')) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin or same domain
            else if (new URL(url).origin === baseUrl) return url;

            return baseUrl;
        },
    },
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}next-auth.session-token`,
            options: cookiesOptions,
        },
        csrfToken: {
            name: `${cookiePrefix}next-auth.csrf-token`,
            options: cookiesOptions,
        },
    },
};

export default NextAuth(authOptions);
