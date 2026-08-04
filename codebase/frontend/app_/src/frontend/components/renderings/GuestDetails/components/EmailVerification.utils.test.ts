import { renderHook } from '@testing-library/react';

import { LoginCustomer } from 'models/data/LoginCustomer';
import { GuestInfo } from 'models/GuestInfo';

import useEmailVerification, { IUseEmailVerificationProps } from './EmailVerification.utils';

const createStores = () => ({
    guestDetailsStore: {
        customerLogin: new LoginCustomer(),
        validateEmail: jest.fn(),
        initializeEmailVerificationPage: jest.fn(),
    },
    layoutStore: { getPhrase: jest.fn(p => p) },
    userStore: { isVerifyingEmail: false },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let mockProps: IUseEmailVerificationProps;

describe('EmailVerification.utils', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = {
            guest: { isLead: true } as GuestInfo,
        };
    });

    describe('useEmailVerification', () => {
        it('should return correct data', () => {
            const {
                result: { current },
            } = renderHook(() => useEmailVerification(mockProps));

            expect(current).toStrictEqual({
                customerLogin: expect.objectContaining({
                    alreadyLoggedEmail: '',
                    email: '',
                    errors: [],
                    forceErrors: false,
                    isEmailDisabled: undefined,
                    isEmailExists: undefined,
                    isEmailValidated: undefined,
                    isNewCustomer: false,
                    password: '',
                    passwordProhibitedWords: [],
                }),
                getPhrase: mockStores.layoutStore.getPhrase,
                isDisplayed: true,
                onChange: expect.any(Function),
                onClick: expect.any(Function),
                title: 'GuestDetails.Titles.EnterYourEmailAddress',
            });
        });

        it('should return correct title when email is not validated', () => {
            const {
                result: { current },
            } = renderHook(() => useEmailVerification(mockProps));

            expect(current.title).toBe('GuestDetails.Titles.EnterYourEmailAddress');
        });

        it('should initialize email verification page on mount', () => {
            renderHook(() => useEmailVerification(mockProps));

            expect(mockStores.guestDetailsStore.initializeEmailVerificationPage).toHaveBeenCalled();
        });
    });
});
