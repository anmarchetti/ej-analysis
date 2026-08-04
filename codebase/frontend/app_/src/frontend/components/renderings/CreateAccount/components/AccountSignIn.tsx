import React, { FC, useState } from 'react';
import { observer } from 'mobx-react';

import useReCaptcha from 'frontend/hooks/useReCaptcha';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { LoginCustomer } from 'models/data/LoginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import ResetPassword from 'frontend/components/common/ResetPassword/ResetPassword';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatablePasswordField from 'frontend/components/common/ValidatablePasswordField';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

export type TAccountSignInType = {
    changeEmail: () => void;
    customerLogin: LoginCustomer;
    onSignIn: () => void;
};
export const AccountSignIn: FC<TAccountSignInType> = ({ onSignIn, customerLogin, changeEmail }) => {
    const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);

    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    useReCaptcha();

    const onChangePassword = (value: string): void => {
        customerLogin.onChangePassword(value);
        customerLogin.cleanUpErrors();
    };

    return (
        <div className='create-account__sign-in-block' data-tid='account-sign-in'>
            <div className='row'>
                <div className='col-lg-4 col-md-6 col-12'>
                    <ValidatableField
                        onChange={changeEmail}
                        id='customer-login-email'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsEmail)}
                        value={customerLogin.email}
                        errors={[]}
                        isVertical
                        hasGroup={false}
                        disabled
                        required
                        hasDisabledFieldClass
                    />
                    <Button type='button' id='changeEmailBtn' dataTid='change-email-btn' isLink onClick={changeEmail}>
                        {getPhrase(SitecoreDictionary.GuestDetailsButtonsChange)}
                    </Button>
                </div>
            </div>

            <ErrorMessage
                message={getPhrase(SitecoreDictionary.CreateAccountErrorsAccountExist)}
                description={getPhrase(SitecoreDictionary.CreateAccountErrorsAccountExistDescription)}
                IsNotification
                icon={<SvgInfoFilled />}
            />

            <div className='row'>
                <div className='col-lg-4 col-md-6 col-12'>
                    <ValidatablePasswordField
                        onChange={onChangePassword}
                        id='customer-login-password'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsPassword)}
                        srLabel={getPhrase(SitecoreDictionary.GuestDetailsLabelsPassword)}
                        value={customerLogin.password}
                        errors={customerLogin.passwordErrors}
                        isVertical
                        hasGroup={false}
                        required
                    />
                    <Button
                        type='button'
                        onClick={(): void => setIsResetPasswordVisible(true)}
                        isLink
                        id='forgotPasswordBtn'
                        dataTid='forgot-password-link'
                    >
                        {getPhrase(SitecoreDictionary.GuestDetailsButtonsForgotYourPassword)}
                    </Button>

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
                </div>
                <div className='col-lg-2 col-md-4 col-12'>
                    <Button
                        type='button'
                        isFullWidth
                        className='guest-login__btn'
                        onClick={onSignIn}
                        disabled={customerLogin.passwordErrors.length > 0}
                        dataTid='login-in-btn'
                    >
                        {getPhrase(SitecoreDictionary.GuestDetailsButtonsSignIn)}
                    </Button>
                </div>
            </div>

            {isResetPasswordVisible && (
                <ResetPassword
                    defaultEmail={customerLogin.email}
                    afterReset={(email: string): void => {
                        customerLogin.onChangeEmail(email);
                        customerLogin.toggleEmailExists(true);
                        customerLogin.toggleEmailValidated(true);
                        customerLogin.cleanUpErrors();
                        customerLogin.rerender();
                    }}
                    onCancelClick={(): void => setIsResetPasswordVisible(false)}
                />
            )}
        </div>
    );
};

export default observer(AccountSignIn);
