import { renderHook } from '@testing-library/react';

import { mockNextAuthUseSession } from 'frontend/__mocks__/next-auth';
import useSSOSession from 'frontend/hooks/useSSOSession';

const userSession = { data: { user: { name: 'User', number: '1', ref: 'user' } }, status: 'authenticated' };

mockNextAuthUseSession.mockReturnValue(userSession);

let mockStores;

const createStores = () => ({
    userStore: {
        onLogout: jest.fn(),
        updateUserData: jest.fn(),
        redirectUrlLocal: 'redirectUrlLocal',
        isLoggingOut: false,
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useSSOSession', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('calls updateUserData when new user is authenticated and session has no error', () => {
        renderHook(useSSOSession);

        expect(mockStores.userStore.updateUserData).toHaveBeenCalledWith(userSession.data);
        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(mockStores.userStore.redirectUrlLocal);
        expect(mockStores.userStore.onLogout).not.toHaveBeenCalled();
    });

    it('calls onLogout when session contains an error', () => {
        mockNextAuthUseSession.mockReturnValueOnce({ ...userSession, data: { ...userSession.data, error: true } });

        renderHook(useSSOSession);

        expect(mockStores.userStore.onLogout).toHaveBeenCalled();
        expect(mockStores.userStore.updateUserData).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
    });

    it('should not logout when session is undefined', () => {
        mockNextAuthUseSession.mockReturnValueOnce({ data: undefined, status: 'unauthenticated' });

        renderHook(useSSOSession);

        expect(mockStores.userStore.onLogout).not.toHaveBeenCalled();
    });

    it('should not update user data when session is undefined', () => {
        mockNextAuthUseSession.mockReturnValueOnce({ data: undefined, status: 'unauthenticated' });

        renderHook(useSSOSession);

        expect(mockStores.userStore.updateUserData).not.toHaveBeenCalled();
    });

    it('should not update user data when session is undefined', () => {
        mockStores.userStore.isLoggingOut = true;

        renderHook(useSSOSession);

        expect(mockStores.userStore.updateUserData).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
        expect(mockStores.userStore.onLogout).not.toHaveBeenCalled();
    });
});
