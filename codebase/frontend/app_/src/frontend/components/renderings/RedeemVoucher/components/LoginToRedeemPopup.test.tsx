import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockLoginCustomer } from 'frontend/__mocks__/loginCustomer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import LoginToRedeemPopup, { ILoginToRedeemPopupProps } from './LoginToRedeemPopup';
jest.mock('frontend/hooks/useReCaptcha');

const createStores = () =>
    createMockStores({
        userStore: {
            customerLogin: mockLoginCustomer,
        },
        redeemVoucherStore: {
            isLoginToRedeemPopupVisible: false,
            setLoginToRedeemPopupVisible: jest.fn(),
            validateVoucherAfterLogin: jest.fn(n => n()),
            setValidatedVoucherPopupVisible: jest.fn(),
        },
        appStore: {
            isScreenMedium: true,
        },
        createAccountStore: {
            setCreateAccountPopupVisible: jest.fn(),
        },
    });

const createProps = (): ILoginToRedeemPopupProps => ({
    title: mockSitecoreField('title'),
    subtitle: mockSitecoreField('subtitle'),
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockSingInSectionProps = jest.fn();
jest.mock('frontend/components/renderings/LoginForm/components/SingInSection', () => ({
    __esModule: true,
    default: props => {
        mockSingInSectionProps(props);

        return (
            <div data-tid='sign-in-section'>
                <button data-tid='log-in-btn' onClick={props.afterLoginAction} />
                <button data-tid='forget-password-btn' onClick={props.setParentResetPasswordVisible} />
            </div>
        );
    },
}));

const mockCreateAccountSectionProps = jest.fn();
jest.mock('frontend/components/renderings/LoginForm/components/CreateAccountSection', () => ({
    __esModule: true,
    default: props => {
        mockCreateAccountSectionProps(props);

        return <div data-tid='create-account-section'>{props.customButton}</div>;
    },
}));

jest.mock('frontend/components/common/ResetPassword/ResetPassword', () => ({
    __esModule: true,
    default: props => <div data-tid='reset-password' onClick={props.afterReset('mail')} />,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <div data-tid={props.dataTid} onClick={props.onClick} />;
    },
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawerProps(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupComponent(props);

        return (
            <div data-tid='popup'>
                <div>{props.children}</div>
                <button onClick={props.onClose} data-tid='close-popup' />
            </div>
        );
    },
}));

describe('<LoginToRedeemPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it("should render 'Login' popup when 'Reset password' popup is NOT visible (desktop)", () => {
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupComponent).toHaveBeenCalledWith({
            containerClass: 'redeem-popup login-to-redeem-popup',
            showCloseButton: true,
            onClose: expect.any(Function),
            children: expect.anything(),
        });

        expect(screen.getAllByTestId('sitecore-jss-text')).toHaveLength(2);
        expect(mockTextProps).toHaveBeenCalledWith({
            tag: 'h3',
            className: 'title',
            field: mockProps.title,
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            tag: 'p',
            className: 'subtitle',
            field: mockProps.subtitle,
        });

        expect(screen.getByTestId('sign-in-section')).toBeInTheDocument();
        expect(mockSingInSectionProps).toHaveBeenCalledWith({
            isHideRememberMe: true,
            hideResetPasswordPopup: true,
            afterLoginAction: expect.any(Function),
            setParentResetPasswordVisible: expect.any(Function),
        });

        expect(screen.getByTestId('create-account-section')).toBeInTheDocument();
        expect(mockCreateAccountSectionProps).toHaveBeenCalledWith({
            className: 'createAccount',
            customButton: expect.anything(),
        });

        expect(screen.getByTestId('create-account-btn')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'btn btn--outlined btn--full-width',
            onClick: expect.any(Function),
            dataTid: 'create-account-btn',
            children: SitecoreDictionary.LoginButtonsCreateAccount,
        });

        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('reset-password')).not.toBeInTheDocument();
    });

    it("should render 'Reset password' popup and NOT render 'Login' popup (desktop)", async () => {
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('forget-password-btn'));

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(screen.getByTestId('reset-password')).toBeInTheDocument();
    });

    it('should handle after reset function', async () => {
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('forget-password-btn'));
        await userEvent.click(screen.getByTestId('reset-password'));

        expect(mockStores.userStore.customerLogin.onChangeEmail).toHaveBeenCalledWith('mail');
        expect(mockStores.userStore.customerLogin.cleanUpErrors).toHaveBeenCalled();
    });

    it('should render "Login" drawer when "Reset password" popup is NOT visible (mobile)', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<LoginToRedeemPopup {...mockProps} />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawerProps).toHaveBeenCalledWith({
            open: mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible,
            className: 'redeem-popup login-to-redeem-popup',
            children: expect.anything(),
        });

        expect(screen.getByTestId('close-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
            className: 'continue-btn',
            onClick: expect.any(Function),
            isTransparent: true,
            dataTid: 'close-button',
            children: SitecoreDictionary.GlobalsButtonsClose,
        });
    });

    it("should render 'Reset password' popup and NOT render 'Login' drawer (mobile)", async () => {
        mockStores.appStore.isScreenMedium = false;
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('forget-password-btn'));

        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
        expect(screen.getByTestId('reset-password')).toBeInTheDocument();
    });

    it("should close 'Login' popup on 'Close' button click (desktop)", async () => {
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('close-popup'));

        expect(mockStores.redeemVoucherStore.setLoginToRedeemPopupVisible).toHaveBeenCalledWith(false);
    });

    it("should close 'Login' drawer on 'Close' button click (mobile)", async () => {
        mockStores.appStore.isScreenMedium = false;
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('close-button'));

        expect(mockStores.redeemVoucherStore.setLoginToRedeemPopupVisible).toHaveBeenCalledWith(false);
    });

    it("should close 'Login' popup and open 'Create account' popup when 'Create account' btn is clicked", async () => {
        mockStores.appStore.isScreenMedium = false;
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('create-account-btn'));

        expect(mockStores.redeemVoucherStore.setLoginToRedeemPopupVisible).toHaveBeenCalledWith(false);
        expect(mockStores.createAccountStore.setCreateAccountPopupVisible).toHaveBeenCalledWith(true);
    });

    it('should validate voucher after login', async () => {
        mockStores.redeemVoucherStore.isLoginToRedeemPopupVisible = true;
        render(<LoginToRedeemPopup {...mockProps} />);

        await userEvent.click(screen.getByTestId('log-in-btn'));

        expect(mockStores.redeemVoucherStore.setLoginToRedeemPopupVisible).toHaveBeenCalledWith(false);
        expect(mockStores.redeemVoucherStore.setValidatedVoucherPopupVisible).toHaveBeenCalledWith(true);
        expect(mockStores.redeemVoucherStore.validateVoucherAfterLogin).toHaveBeenCalled();
    });
});
