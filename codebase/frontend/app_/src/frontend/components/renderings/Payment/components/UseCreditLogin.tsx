import React, { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { containsSubstring } from 'frontend/utils/string.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import LoginPopup from 'frontend/components/common/LoginPopup/LoginPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

export interface IUseCreditLoginProps {
    textField: ISitecoreField<string>;
    onSuccessLogin?: () => Promise<void>;
}

export const UseCreditLogin: FC<IUseCreditLoginProps> = ({ textField, onSuccessLogin }) => {
    const {
        getPhrase,
        isLoggedIn,
        customerLogin,
        customerEmail,
        getCredit,
        setIsRedirectPreventedAfterLogin,
        getLeadEmailFromSessionStorage,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isLoggedIn: stores.userStore.isLoggedIn,
        customerLogin: stores.userStore.customerLogin,
        customerEmail: stores.payStore.customerEmail,
        getCredit: stores.payStore.getCredit,
        setIsRedirectPreventedAfterLogin: stores.userStore.setIsRedirectPreventedAfterLogin,
        getLeadEmailFromSessionStorage: stores.guestDetailsStore.getLeadEmailFromSessionStorage,
    }));

    useEffect(() => {
        setIsRedirectPreventedAfterLogin(true);
    }, []);

    const [isPopupShown, toggleLoginPopup] = useState(false);

    /**
     * Open login popup by clicking on login link in RichText
     */
    const onRichTextLinkClick = (e: MouseEvent) => {
        const target = e.target as HTMLAnchorElement;
        const url = target ? target.dataset?.path ?? target.href : null;

        if (url && containsSubstring(url, SitePath.Login)) {
            e.preventDefault();
            openLoginPopup();
        }
    };

    /** Open login popup with pre-filled and disabled email field  */
    const openLoginPopup = () => {
        const email = customerEmail || getLeadEmailFromSessionStorage();

        if (email) {
            customerLogin.onChangeEmail(email);
            customerLogin.toggleEmailDisabled(true);
        }

        toggleLoginPopup(true);
    };

    const closeLoginPopup = () => {
        toggleLoginPopup(false);
    };

    /** Get credit after successful login */
    const afterLoginAction = async () => {
        if (!customerLogin.errors.length) {
            await getCredit();
            await onSuccessLogin?.();
            closeLoginPopup();
        }
    };

    return (
        <>
            {!isLoggedIn && (
                <RichTextWithLinks
                    tag='div'
                    className='payment-credit-login payment-rounded-block'
                    field={textField}
                    onLinkClick={onRichTextLinkClick}
                />
            )}
            {isPopupShown && (
                <LoginPopup
                    title={getPhrase(SitecoreDictionary.PaymentCreditLoginPopupTitle)}
                    description={getPhrase(SitecoreDictionary.PaymentCreditLoginPopupDescription)}
                    onClose={closeLoginPopup}
                    isHideRememberMe
                    afterLoginAction={afterLoginAction}
                />
            )}
        </>
    );
};

export default observer(UseCreditLogin);
