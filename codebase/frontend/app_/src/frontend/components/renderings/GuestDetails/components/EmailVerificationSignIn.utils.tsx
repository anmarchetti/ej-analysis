import { useEffect, useState } from 'react';

import useReCaptcha from 'frontend/hooks/useReCaptcha';
import useStore from 'frontend/hooks/useStore';
import { BaseLayoutStore } from 'frontend/store/base';
import { IHolidaysStores } from 'frontend/store/holidays';
import { GuestDetailsStore } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import Button from 'frontend/components/common/Button';
import { gaLoginSuccess } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import styles from './EmailVerificationSignIn.module.scss';

export interface IUseEmailVerificationSignInData {
    continueWithoutSignIn: () => void;
    customerLogin: GuestDetailsStore['customerLogin'];
    getPhrase: BaseLayoutStore['getPhrase'];
    isDisplayed: boolean;
    isPasswordVisible: boolean;
    isResetPasswordVisible: boolean;
    isScreenMedium: boolean;
    isSignInChecked: Nullable<boolean>;
    onCancel: () => void;
    onChangePassword: (value: string) => void;
    onForgotPasswordClick: () => void;
    renderSignInButton: () => JSX.Element;
    setIsPasswordVisible: React.Dispatch<React.SetStateAction<boolean>>;
    toggleSignIn: (state: boolean) => void;
}

export const useEmailVerificationSignIn = (): IUseEmailVerificationSignInData => {
    const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);

    const { getPhrase, customerLogin, signIn, toggleGuestInfoPage, trackAccountEvent, isScreenMedium } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            customerLogin: stores.guestDetailsStore.customerLogin,
            signIn: stores.guestDetailsStore.signIn,
            toggleGuestInfoPage: (): void =>
                stores.guestDetailsStore.toggleGuestDetailsPhase(GuestDetailsPhase.GuestsInfo),
            trackAccountEvent: stores.trackingStore.trackAccountEvent,
            isScreenMedium: stores.appStore.isScreenMedium,
        }),
    );

    const [isSignInChecked, setIsSignInChecked] = useState<Nullable<boolean>>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

    useReCaptcha(!!isSignInChecked);

    useEffect(() => (): void => setIsResetPasswordVisible(false), []);

    const { pushTrackingEvent } = usePaymentTracking();

    const handleSignIn = (): void => {
        signIn(() => pushTrackingEvent(gaLoginSuccess));
    };

    const toggleSignIn = (state: boolean): void => {
        setIsSignInChecked(state);

        if (!state) {
            toggleGuestInfoPage();
        }
    };

    const onChangePassword = (value: string): void => {
        customerLogin.onChangePassword(value);
        customerLogin.cleanUpErrors();
    };

    const continueWithoutSignIn = (): void => {
        toggleSignIn(false);
        trackAccountEvent(EventTypes.GuestCheckout);
    };

    const onForgotPasswordClick = (): void => {
        setIsResetPasswordVisible(true);
    };

    const renderSignInButton = (): JSX.Element => (
        <Button
            className={styles.button}
            onClick={handleSignIn}
            disabled={customerLogin.passwordErrors.length > 0}
            dataTid='sign-in-btn'
        >
            {getPhrase(SitecoreDictionary.GuestDetailsButtonsSignIn)}
        </Button>
    );

    return {
        isDisplayed: customerLogin.isEmailValidated,
        getPhrase,
        toggleSignIn,
        isSignInChecked,
        customerLogin,
        isScreenMedium,
        onChangePassword,
        isPasswordVisible,
        setIsPasswordVisible,
        onForgotPasswordClick,
        continueWithoutSignIn,
        renderSignInButton,
        isResetPasswordVisible,
        onCancel: (): void => setIsResetPasswordVisible(false),
    };
};

export default useEmailVerificationSignIn;
