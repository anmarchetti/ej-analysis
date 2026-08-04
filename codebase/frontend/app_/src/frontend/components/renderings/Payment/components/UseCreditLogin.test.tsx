import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IUseCreditLoginProps, UseCreditLogin } from './UseCreditLogin';

const createProps = (): IUseCreditLoginProps => ({
    textField: mockSitecoreField('test text'),
    onSuccessLogin: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: () => [true, jest.fn()],
}));

const mockLoginPopup = jest.fn();
jest.mock('frontend/components/common/LoginPopup/LoginPopup', () => ({
    __esModule: true,
    default: ({ afterLoginAction, ...props }) => {
        mockLoginPopup(props);

        return <div data-tid='login-popup' onClick={afterLoginAction} />;
    },
}));

const mockHref = jest.fn().mockReturnValue('/login');
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, onLinkClick }) => (
        <div data-tid='rich-text'>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href={mockHref()} data-tid='link' onClick={onLinkClick} />
            {field.value}
        </div>
    ),
}));

describe('<UseCreditLogin />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            userStore: {
                isLoggedIn: false,
                customerLogin: {
                    errors: [],
                    onChangeEmail: jest.fn(),
                    toggleEmailDisabled: jest.fn(),
                },
                setIsRedirectPreventedAfterLogin: jest.fn(),
            },
            payStore: {
                customerEmail: 'test@email.com',
                getCredit: jest.fn(),
            },
            guestDetailsStore: { getLeadEmailFromSessionStorage: jest.fn(() => 'test2@email.com') },
        });
    });

    it('should NOT render RichTextWithLinks when isLoggedIn', () => {
        mockStores.userStore.isLoggedIn = true;

        render(<UseCreditLogin {...mockProps} />);

        expect(screen.queryByTestId('rich-text')).not.toBeInTheDocument();
    });

    it('should render RichTextWithLinks and popup when is NOT loggedIn', () => {
        render(<UseCreditLogin {...mockProps} />);

        expect(screen.getByTestId('rich-text')).toHaveTextContent('test text');
        expect(screen.getByTestId('login-popup')).toBeInTheDocument();
        expect(mockLoginPopup).toHaveBeenCalledWith({
            title: SitecoreDictionary.PaymentCreditLoginPopupTitle,
            description: SitecoreDictionary.PaymentCreditLoginPopupDescription,
            onClose: expect.any(Function),
            isHideRememberMe: true,
        });
    });

    it('should NOT call onChangeEmail and toggleEmailDisabled on link click when email is NOT provided', async () => {
        mockStores.payStore.customerEmail = null;
        mockStores.guestDetailsStore.getLeadEmailFromSessionStorage.mockReturnValue(null);
        render(<UseCreditLogin {...mockProps} />);

        await userEvent.click(screen.getByTestId('link'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).not.toHaveBeenCalled();
        expect(mockStores.userStore.customerLogin.toggleEmailDisabled).not.toHaveBeenCalled();
    });

    it('should NOT call onChangeEmail and toggleEmailDisabled on link click when link has no href', async () => {
        mockHref.mockReturnValueOnce(null);
        render(<UseCreditLogin {...mockProps} />);

        await userEvent.click(screen.getByTestId('link'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).not.toHaveBeenCalled();
        expect(mockStores.userStore.customerLogin.toggleEmailDisabled).not.toHaveBeenCalled();
    });

    it('should call onChangeEmail with customerEmail and toggleEmailDisabled on link click when href is /login', async () => {
        render(<UseCreditLogin {...mockProps} />);

        await userEvent.click(screen.getByTestId('link'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).toHaveBeenCalledWith('test@email.com');
        expect(mockStores.userStore.customerLogin.toggleEmailDisabled).toHaveBeenCalledWith(true);
    });

    it('should call onChangeEmail with email from getLeadEmailFromSessionStorage on link click when href is /login when customerEmail is NOT provided', async () => {
        mockStores.payStore.customerEmail = null;
        render(<UseCreditLogin {...mockProps} />);

        await userEvent.click(screen.getByTestId('link'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).toHaveBeenCalledWith('test2@email.com');
    });

    it('should call getCredit and onSuccessLogin on afterLoginAction click', async () => {
        render(<UseCreditLogin {...mockProps} />);

        await userEvent.click(screen.getByTestId('login-popup'));

        expect(mockStores.payStore.getCredit).toHaveBeenCalled();
        expect(mockProps.onSuccessLogin).toHaveBeenCalled();
    });

    it('should NOT call getCredit and onSuccessLogin on afterLoginAction click when errors exist', async () => {
        mockStores.userStore.customerLogin.errors = ['error'];
        render(<UseCreditLogin {...mockProps} />);

        await userEvent.click(screen.getByTestId('login-popup'));

        expect(mockStores.payStore.getCredit).not.toHaveBeenCalled();
        expect(mockProps.onSuccessLogin).not.toHaveBeenCalled();
    });
});
