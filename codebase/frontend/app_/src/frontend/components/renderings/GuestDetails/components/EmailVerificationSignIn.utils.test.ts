import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { LoginCustomer } from 'models/data/LoginCustomer';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';

import useEmailVerificationSignIn from './EmailVerificationSignIn.utils';

const createStores = () =>
    createMockStores({
        guestDetailsStore: {
            customerLogin: new LoginCustomer(),
            signIn: jest.fn(),
            toggleGuestDetailsPhase: jest.fn(),
        },
        appStore: {
            isScreenMedium: false,
        },
        trackingStore: {
            trackAccountEvent: jest.fn(),
        },
        reCaptchaStore: { loadReCaptcha: jest.fn(), removeReCaptcha: jest.fn(), executeReCaptcha: jest.fn() },
    });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('EmailVerificationSignIn.utils', () => {
    describe('useEmailVerificationSignIn', () => {
        beforeEach(() => {
            mockStores = createStores();
        });

        it('should return correct initial state for email verification sign in', () => {
            const {
                result: { current },
            } = renderHook(() => useEmailVerificationSignIn());

            expect(current).toStrictEqual({
                isDisplayed: undefined,
                getPhrase: mockStores.layoutStore.getPhrase,
                toggleSignIn: expect.any(Function),
                isSignInChecked: null,
                customerLogin: mockStores.guestDetailsStore.customerLogin,
                isScreenMedium: false,
                onChangePassword: expect.any(Function),
                isPasswordVisible: false,
                setIsPasswordVisible: expect.any(Function),
                onForgotPasswordClick: expect.any(Function),
                continueWithoutSignIn: expect.any(Function),
                renderSignInButton: expect.any(Function),
                isResetPasswordVisible: false,
                onCancel: expect.any(Function),
            });
        });

        it('should toggle sign in state and calls toggleGuestInfoPage when state is false', () => {
            const {
                result: { current },
            } = renderHook(() => useEmailVerificationSignIn());

            current.toggleSignIn(false);

            expect(mockStores.guestDetailsStore.toggleGuestDetailsPhase).toHaveBeenCalledWith(
                GuestDetailsPhase.GuestsInfo,
            );
        });

        it('should call signIn on handleSignIn', () => {
            const {
                result: { current },
            } = renderHook(() => useEmailVerificationSignIn());

            current.renderSignInButton().props.onClick();

            expect(mockStores.guestDetailsStore.signIn).toHaveBeenCalled();
        });
    });
});
