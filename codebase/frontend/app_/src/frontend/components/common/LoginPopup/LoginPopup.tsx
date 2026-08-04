import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Popup } from 'frontend/components/common/Popup';
import ResetPassword from 'frontend/components/common/ResetPassword/ResetPassword';
import SignInSection, { ISignInProps } from 'frontend/components/renderings/LoginForm/components/SingInSection';

import styles from './LoginPopup.module.scss';

export interface ILoginPopupProps extends ISignInProps {
    description: string;
    onClose: () => void;
    title: string;
    popupClass?: string;
}

export const LoginPopup: FC<ILoginPopupProps> = props => {
    const { title, description, onClose, popupClass, ...signInProps } = props;

    const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
    const { customerLogin } = useStore((stores: IHolidaysStores) => ({
        customerLogin: stores.userStore.customerLogin,
    }));

    useEffect(() => () => customerLogin.cleanUpModel(), []);

    /** If only one popup can be shown at time, ResetPassword Popup or Login Popup will be shown.
     * Else 2 popups will be shown (ResetPassword on top of Login Popup) */
    return isResetPasswordVisible ? (
        <ResetPassword
            defaultEmail={customerLogin.email}
            afterReset={(email: string): void => {
                customerLogin.onChangeEmail(email);
                customerLogin.cleanUpErrors();
            }}
            onCancelClick={(): void => setIsResetPasswordVisible(false)}
        />
    ) : (
        <Popup
            containerClass={classNames('login-popup', popupClass)}
            dialogClass={styles.popupDialog}
            bodyClass={styles.popupBody}
            showCloseButton
            onClose={onClose}
        >
            <div className={styles.container}>
                <h2 className={styles.title}>{title}</h2>
                <p data-tid='login-popup-description' className={styles.description}>
                    {description}
                </p>
                <SignInSection
                    {...signInProps}
                    hideResetPasswordPopup
                    setParentResetPasswordVisible={(): void => setIsResetPasswordVisible(true)}
                    disableCleanUpOnUnmount
                    createAccountClassName={styles.createAccount}
                />
            </div>
        </Popup>
    );
};

export default observer(LoginPopup);
