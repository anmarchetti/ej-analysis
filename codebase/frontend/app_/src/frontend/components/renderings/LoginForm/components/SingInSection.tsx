import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useReCaptcha from 'frontend/hooks/useReCaptcha';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import ResetPassword from 'frontend/components/common/ResetPassword/ResetPassword';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatablePasswordField from 'frontend/components/common/ValidatablePasswordField';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import CreateAccountSection from './CreateAccountSection';

export interface ISignInProps {
    afterLoginAction?: () => void;
    createAccountClassName?: string;
    disableCleanUpOnUnmount?: boolean;
    hideResetPasswordPopup?: boolean;
    isCreateAccountSectionShown?: boolean;
    isCtaHidden?: boolean;
    isHideRememberMe?: boolean;
    isLoginToAddShortlist?: boolean;
    isReCaptchaDisabled?: boolean;
    logoutIfLoggedIn?: boolean;
    onCreateAccountClick?: (e: React.MouseEvent) => void;
    setParentResetPasswordVisible?: () => void;
}

export const SingIn: React.FC<ISignInProps> = ({
    afterLoginAction,
    createAccountClassName,
    disableCleanUpOnUnmount,
    hideResetPasswordPopup,
    isCreateAccountSectionShown,
    isCtaHidden,
    isHideRememberMe,
    isLoginToAddShortlist,
    isReCaptchaDisabled,
    logoutIfLoggedIn,
    onCreateAccountClick,
    setParentResetPasswordVisible,
}) => {
    const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);

    const {
        getPhrase,
        customerLogin,
        rememberMe,
        setRememberMe,
        onLogin,
        formRerenderTrigger,
        setNeedShowBookingInShortlistModal,
        initializeCustomerLogin,
        setRedirectUrl,
        viewMyBooking,
        myBookings,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        customerLogin: stores.userStore.customerLogin,
        setRedirectUrl: stores.userStore.setRedirectUrl,
        viewMyBooking: stores.queryParamStore.viewMyBooking,
        myBookings: stores.queryParamStore.myBookings,
        rememberMe: stores.userStore.rememberMe,
        setRememberMe: stores.userStore.setRememberMe,
        onLogin: stores.userStore.onLogin,
        formRerenderTrigger: stores.userStore.formRerenderTrigger,
        setNeedShowBookingInShortlistModal:
            stores.shortlistStore?.setNeedShowBookingInShortlistModal ?? ((): void => undefined),
        initializeCustomerLogin: stores.userStore.initializeCustomerLogin,
    }));

    useEffect(() => {
        initializeCustomerLogin();

        return () => {
            !disableCleanUpOnUnmount && customerLogin.cleanUpModel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // trigger fields validation on reset password window hide
        if (!isResetPasswordVisible) {
            triggerFieldsValidation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isResetPasswordVisible]);

    useReCaptcha(!isReCaptchaDisabled);

    const triggerFieldsValidation = (): void => {
        if (customerLogin.email && emailRef?.current) {
            emailRef.current.focus();
            emailRef.current.blur();
        }

        if (customerLogin.password && passRef?.current) {
            passRef.current.focus();
            passRef.current.blur();
        }
    };

    const onSubmitLogIn = (event?: React.MouseEvent | React.FormEvent): void => {
        event?.preventDefault();
        isLoginToAddShortlist && setNeedShowBookingInShortlistModal(true);

        if (viewMyBooking() || myBookings()) {
            setRedirectUrl(SitePath.ViewBookings);
        }

        onLogin(logoutIfLoggedIn, afterLoginAction);
    };

    const onShowResetPassword = (): void => {
        if (hideResetPasswordPopup) {
            setParentResetPasswordVisible?.();
        } else {
            setIsResetPasswordVisible(true);
        }
    };

    return (
        <div id='login-form__sign-in'>
            <div className='login-form__content'>
                <form onSubmit={onSubmitLogIn} autoComplete='off' key={formRerenderTrigger}>
                    <ValidatableField
                        onChange={(value: string): void => {
                            customerLogin.onChangeEmail(value, false);
                            customerLogin.cleanUpErrors();
                        }}
                        id='email'
                        name='email'
                        label={getPhrase(SitecoreDictionary.LoginLabelsEmailAddress)}
                        value={customerLogin.email}
                        errors={customerLogin.emailErrors}
                        autoComplete={false}
                        isVertical
                        inputRef={emailRef}
                        shouldTrimOnBlur
                        disabled={customerLogin.isEmailDisabled}
                        hasDisabledFieldClass={customerLogin.isEmailDisabled}
                    />
                    <ValidatablePasswordField
                        onChange={(value: string): void => {
                            customerLogin.onChangePassword(value);
                            customerLogin.cleanUpErrors();
                        }}
                        id='password'
                        name='password'
                        label={getPhrase(SitecoreDictionary.LoginLabelsPassword)}
                        value={customerLogin.password}
                        errors={customerLogin.passwordErrors}
                        autoComplete={false}
                        isVertical
                        inputRef={passRef}
                    />

                    {customerLogin.firstError && (
                        <ErrorMessage
                            message={getPhrase(customerLogin.firstError.title)}
                            description={
                                customerLogin.firstError.description && getPhrase(customerLogin.firstError.description)
                            }
                            errorMessageClass='error-container'
                            icon={
                                <i className='error-message__icon'>
                                    <SvgWarningFilled />
                                </i>
                            }
                        />
                    )}

                    <Button type='button' onClick={onShowResetPassword} isLink dataTid='forgot-password-link'>
                        {getPhrase(SitecoreDictionary.LoginButtonsForgotPassword)}
                    </Button>
                    {!hideResetPasswordPopup && isResetPasswordVisible && (
                        <ResetPassword
                            defaultEmail={customerLogin.email}
                            afterReset={(email: string): void => {
                                customerLogin.onChangeEmail(email);
                                customerLogin.cleanUpErrors();
                            }}
                            onCancelClick={(): void => setIsResetPasswordVisible(false)}
                        />
                    )}

                    <div className='row sign-up__button'>
                        {!isHideRememberMe && (
                            <div data-tid='remember-me-checkbox' className='col-12 col-md-6'>
                                <Checkbox
                                    small
                                    tick
                                    textRight
                                    checked={rememberMe}
                                    label={getPhrase(SitecoreDictionary.LoginLabelsRememberMe)}
                                    onChange={(e): void => setRememberMe(e.target.checked)}
                                    data-tid='remember-me-checkbox'
                                />
                            </div>
                        )}

                        {!isCtaHidden && (
                            <div
                                data-tid='sign-in-btn'
                                className={classNames('col-12', !isHideRememberMe && 'col-md-6')}
                            >
                                <Button
                                    onClick={onSubmitLogIn}
                                    disabled={
                                        customerLogin.emailErrors.length > 0 || customerLogin.passwordErrors.length > 0
                                    }
                                    dataTid='sign-in-button'
                                    type='submit'
                                >
                                    {getPhrase(SitecoreDictionary.LoginButtonsSignIn)}
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {isCreateAccountSectionShown && (
                <CreateAccountSection onLinkClick={onCreateAccountClick} className={createAccountClassName} />
            )}
        </div>
    );
};

export default observer(SingIn);
