import React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

export const CreateAccountSuccessPopup = () => {
    const { email, getPhrase, toggleSuccessPopup, redirectToLoginPage, isLoggedIn, isPopupShown } = useStore(
        (stores: IHolidaysStores) => ({
            email: stores.createAccountStore.customerLogin.email,
            getPhrase: stores.layoutStore.getPhrase,
            toggleSuccessPopup: stores.createAccountStore.toggleSuccessPopup,
            isPopupShown: stores.createAccountStore.isSuccessPopupShown,
            redirectToLoginPage: stores.routerStore.redirectToLoginPage,
            isLoggedIn: stores.userStore.isLoggedIn,
        }),
    );

    const onClose = () => toggleSuccessPopup(false);

    const onLogin = () => {
        onClose();
        redirectToLoginPage();
    };

    const renderFooterButtons = () => (
        <>
            <Button isMedium isTransparent onClick={() => onClose()} data-tid='close-button'>
                {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
            </Button>
            {!isLoggedIn && (
                <Button isMedium onClick={() => onLogin()} data-tid='login-button'>
                    {getPhrase(SitecoreDictionary.CreateAccountButtonsLogIn)}
                </Button>
            )}
        </>
    );

    if (!isPopupShown) {
        return null;
    }

    return (
        <Popup
            containerClass='create-account-success-popup'
            isContentCentered
            title={getPhrase(SitecoreDictionary.CreateAccountSuccessPopupAccountCreated)}
            footerContent={renderFooterButtons()}
            data-tid='success-popup'
        >
            <p data-tid='thanks-message'>{getPhrase(SitecoreDictionary.CreateAccountSuccessPopupThanks)}</p>
            <p
                data-tid='email-message'
                dangerouslySetInnerHTML={{
                    __html: Tokenizer.replaceToken(
                        getPhrase(SitecoreDictionary.CreateAccountSuccessPopupSentToEmail),
                        Tokens.Email,
                        `<strong>${email}</strong>`,
                    ),
                }}
            />
            <p className='create-account-success-popup__note' data-tid='note-message'>
                {getPhrase(SitecoreDictionary.CreateAccountSuccessPopupUseAccount)}
            </p>
        </Popup>
    );
};

export default observer(CreateAccountSuccessPopup);
