import React, { useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import ResetPassword from 'frontend/components/common/ResetPassword/ResetPassword';
import CreateAccountSection from 'frontend/components/renderings/LoginForm/components/CreateAccountSection';
import SingInSection from 'frontend/components/renderings/LoginForm/components/SingInSection';

import styles from './LoginToRedeemPopup.module.scss';

export interface ILoginToRedeemPopupProps {
    subtitle: ISitecoreField<string>;
    title: ISitecoreField<string>;
}

const LoginToRedeemPopup: React.FC<ILoginToRedeemPopupProps> = ({ title, subtitle }) => {
    const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
    const {
        isLoginToRedeemPopupVisible,
        isScreenMedium,
        setLoginToRedeemPopupVisible,
        getPhrase,
        validateVoucherAfterLogin,
        customerLogin,
        setCreateAccountPopupVisible,
        setValidatedVoucherPopupVisible,
    } = useStore((stores: IHolidaysStores) => ({
        isLoginToRedeemPopupVisible: stores.redeemVoucherStore.isLoginToRedeemPopupVisible,
        isScreenMedium: stores.appStore.isScreenMedium,
        setLoginToRedeemPopupVisible: stores.redeemVoucherStore.setLoginToRedeemPopupVisible,
        getPhrase: stores.layoutStore.getPhrase,
        validateVoucherAfterLogin: stores.redeemVoucherStore.validateVoucherAfterLogin,
        customerLogin: stores.userStore.customerLogin,
        setCreateAccountPopupVisible: stores.createAccountStore.setCreateAccountPopupVisible,
        setValidatedVoucherPopupVisible: stores.redeemVoucherStore.setValidatedVoucherPopupVisible,
    }));

    const afterLoginAction = async (): Promise<void> => {
        const onSuccess = (): void => {
            setLoginToRedeemPopupVisible(false);
            setValidatedVoucherPopupVisible(true);
        };

        await validateVoucherAfterLogin(onSuccess);
    };

    const content = (
        <div className='login-to-redeem-popup__container'>
            <div className='login-wrapper'>
                <Text tag='h3' className='title' field={title} />
                <Text tag='p' className='subtitle' field={subtitle} />
                <SingInSection
                    isHideRememberMe
                    hideResetPasswordPopup
                    setParentResetPasswordVisible={(): void => setIsResetPasswordVisible(true)}
                    afterLoginAction={() => afterLoginAction()}
                />
            </div>
            <div className='create-account-wrapper'>
                <CreateAccountSection
                    className={styles.createAccount}
                    customButton={
                        <Button
                            className='btn btn--outlined btn--full-width'
                            onClick={(): void => {
                                setLoginToRedeemPopupVisible(false);
                                setCreateAccountPopupVisible(true);
                            }}
                            dataTid='create-account-btn'
                        >
                            {getPhrase(SitecoreDictionary.LoginButtonsCreateAccount)}
                        </Button>
                    }
                />
            </div>
        </div>
    );

    if (isResetPasswordVisible) {
        return (
            <ResetPassword
                defaultEmail={customerLogin.email}
                afterReset={(email: string): void => {
                    customerLogin.onChangeEmail(email);
                    customerLogin.cleanUpErrors();
                }}
                onCancelClick={(): void => setIsResetPasswordVisible(false)}
            />
        );
    }

    if (isScreenMedium && isLoginToRedeemPopupVisible) {
        return (
            <Popup
                containerClass='redeem-popup login-to-redeem-popup'
                showCloseButton
                onClose={(): void => setLoginToRedeemPopupVisible(false)}
            >
                {content}
            </Popup>
        );
    }

    return (
        <Drawer open={isLoginToRedeemPopupVisible} className='redeem-popup login-to-redeem-popup'>
            {content}
            <div className='drawer__actions'>
                <Button
                    isTransparent
                    onClick={(): void => setLoginToRedeemPopupVisible(false)}
                    className='continue-btn'
                    dataTid='close-button'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            </div>
        </Drawer>
    );
};

export default observer(LoginToRedeemPopup);
