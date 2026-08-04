import { useEffect } from 'react';

import useStore from 'frontend/hooks/useStore';
import { BaseLayoutStore } from 'frontend/store/base';
import { IHolidaysStores } from 'frontend/store/holidays';
import { GuestDetailsStore } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';

export interface IUseEmailVerificationProps {
    guest: GuestInfo;
}

interface IUseEmailVerificationData {
    customerLogin: GuestDetailsStore['customerLogin'];
    getPhrase: BaseLayoutStore['getPhrase'];
    isDisplayed: boolean;
    onChange: (value: string) => void;
    onClick: () => void;
    title: string;
}

export const useEmailVerification = ({ guest }: IUseEmailVerificationProps): IUseEmailVerificationData => {
    const { customerLogin, getPhrase, validateEmail, initializeEmailVerificationPage } = useStore(
        (stores: IHolidaysStores) => ({
            customerLogin: stores.guestDetailsStore.customerLogin,
            getPhrase: stores.layoutStore.getPhrase,
            validateEmail: stores.guestDetailsStore.validateEmail,
            initializeEmailVerificationPage: stores.guestDetailsStore.initializeEmailVerificationPage,
        }),
    );

    useEffect(() => {
        initializeEmailVerificationPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onChangeEmail = (value: string): void => {
        customerLogin.setForceErrors(false);
        customerLogin.onChangeEmail(value);
        customerLogin.cleanUpErrors();
    };

    const onClick = (): void => {
        if (customerLogin.emailErrors.length > 0) {
            customerLogin.setForceErrors(true);
        } else {
            validateEmail();
        }
    };

    return {
        isDisplayed: guest.isLead,
        onClick,
        onChange: onChangeEmail,
        getPhrase,
        customerLogin,
        title: getPhrase(
            customerLogin.isEmailValidated
                ? SitecoreDictionary.GuestDetailsTitlesFillInDetails
                : SitecoreDictionary.GuestDetailsTitlesEnterYourEmailAddress,
        ),
    };
};

export default useEmailVerification;
