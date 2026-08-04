import React, { FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ApiError } from 'models/data/ApiError';
import { LoginCustomer } from 'models/data/LoginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import AfterResetMessage from './components/AfterResetMessage/AfterResetMessage';
import ResetPasswordErrorPopup from './components/ResetPasswordErrorPopup/ResetPasswordErrorPopup';
import ResetPasswordForm from './components/ResetPasswordForm/ResetPasswordForm';

import styles from './ResetPassword.module.scss';

export enum ResetPasswordPhase {
    ProvideEmail = 'ProvideEmail',
    PasswordReset = 'PasswordReset',
}

interface ISuccessSubmitCustomEvent {
    email: string;
}

export interface IResetPasswordProps {
    afterReset?: (email: string) => void;
    defaultEmail?: string;
    onCancelClick?: () => void;
}

export const ResetPassword: FC<IResetPasswordProps> = ({ afterReset, defaultEmail, onCancelClick }) => {
    const [phase, setPhase] = useState(ResetPasswordPhase.ProvideEmail);
    const [finalEmail, setFinalEmail] = useState<string>('');
    const customerLogin = useMemo(() => new LoginCustomer(), []);
    const { onChangeEmail, email, emailErrors } = customerLogin;
    const {
        getPhrase,
        resetPassword,
        rerenderForm,
        customerErrorHandler,
        trackAccountEvent,
        isCIAMFunctionalityEnabled,
        isCIAMForgetPasswordFormEnabled,
        trackCustomError,
    } = useStore(({ layoutStore, userStore, trackingStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
        resetPassword: userStore.resetPassword,
        rerenderForm: userStore.rerenderForm,
        customerErrorHandler: userStore.customerErrorHandler,
        trackAccountEvent: trackingStore.trackAccountEvent,
        trackCustomError: trackingStore.trackCustomError,
        isCIAMFunctionalityEnabled: layoutStore.isCIAMFunctionalityEnabled,
        isCIAMForgetPasswordFormEnabled: layoutStore.isCIAMForgetPasswordFormEnabled,
    }));

    const isCIAMEnabled = isCIAMFunctionalityEnabled && isCIAMForgetPasswordFormEnabled;

    useEffect(() => {
        trackAccountEvent(EventTypes.PasswordReset);
    }, []);

    useEffect(() => {
        defaultEmail && onChangeEmail(defaultEmail);

        if (isCIAMEnabled) {
            window.addEventListener('ciam:forgotten-password:cancel-click', onClosePopup);
            window.addEventListener('ciam:forgotten-password:success', onSuccessSubmit);
            window.addEventListener('ciam:forgotten-password:error', onErrorHandler);
        }

        return () => {
            setPhase(ResetPasswordPhase.ProvideEmail);

            if (isCIAMEnabled) {
                window.removeEventListener('ciam:forgotten-password:cancel-click', onClosePopup);
                window.removeEventListener('ciam:forgotten-password:success', onSuccessSubmit);
                window.removeEventListener('ciam:forgotten-password:error', onErrorHandler);
            }
        };
    }, [isCIAMEnabled]);

    const onResetPassword = async (): Promise<void> => {
        if (customerLogin.errors.length > 0) return;

        trackAccountEvent(EventTypes.ConfirmPasswordReset);
        try {
            await resetPassword(email);
        } catch (e) {
            if (e instanceof ApiError) {
                customerLogin.errors = customerErrorHandler(e);
            }

            return;
        }
        setPhase(ResetPasswordPhase.PasswordReset);
        setFinalEmail(email);
    };

    const onClosePopup = (): void => {
        onCancelClick?.();
        rerenderForm();
    };

    const onErrorHandler = (): void => {
        customerLogin.errors = [
            {
                title: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerError,
                description: SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerErrorDescription,
            },
        ];

        const errorText = getPhrase(SitecoreDictionary.LoginErrorMessagesNetworkError);
        trackCustomError(errorText, errorText);
    };

    const onSuccessSubmit = (event: CustomEvent<ISuccessSubmitCustomEvent>): void => {
        const { email } = event.detail;
        setFinalEmail(email);
        trackAccountEvent(EventTypes.ConfirmPasswordReset);
        setPhase(ResetPasswordPhase.PasswordReset);
    };

    return isCIAMEnabled && customerLogin.firstError ? (
        <ResetPasswordErrorPopup
            onClose={(): void => {
                customerLogin.cleanUpErrors();
                onClosePopup();
            }}
        />
    ) : (
        <Popup
            onClose={onClosePopup}
            containerClass={styles.forgotPasswordPopup}
            bodyClass={styles.popupBody}
            title={
                phase === ResetPasswordPhase.PasswordReset
                    ? getPhrase(SitecoreDictionary.LoginTitlesWeSentYouEmail)
                    : getPhrase(SitecoreDictionary.LoginTitlesResetYourPassword)
            }
            footerContent={
                !isCIAMEnabled && phase !== ResetPasswordPhase.PasswordReset ? (
                    <>
                        <Button isTransparent onClick={onClosePopup} dataTid='cancel-button'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                        </Button>
                        <Button
                            disabled={emailErrors.length > 0}
                            isMedium
                            onClick={onResetPassword}
                            dataTid='confirm-button'
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsConfirm)}
                        </Button>
                    </>
                ) : undefined
            }
        >
            {phase === ResetPasswordPhase.PasswordReset ? (
                <AfterResetMessage afterReset={afterReset} email={finalEmail} onClosePopup={onClosePopup} />
            ) : (
                <ResetPasswordForm customerLogin={customerLogin} isCIAMEnabled={isCIAMEnabled} />
            )}
        </Popup>
    );
};

export default observer(ResetPassword);
