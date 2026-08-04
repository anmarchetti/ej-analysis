import React, { useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import CreateAccount, { ICreateAccountFields } from 'frontend/components/renderings/CreateAccount/CreateAccount';

import AccountCreatedForRedeemPopup from './components/AccountCreatedForRedeemPopup/AccountCreatedForRedeemPopup';

export interface ICreateAccountPopupFields extends ICreateAccountFields {
    ContentSuccessPopup: ISitecoreField<string>;
    PopupDescription: ISitecoreField<string>;
    PopupSubtitle: ISitecoreField<string>;

    PopupTitle: ISitecoreField<string>;
}

export type TCreateAccountPopupProps = ISitecoreComponent<{
    airportsGroups: IAirportCountry[];
    data: ICreateAccountPopupFields;
}>;

export const CreateAccountPopup = (props: TCreateAccountPopupProps) => {
    const {
        isScreenMedium,
        isCreateAccountPopupVisible,
        setCreateAccountPopupVisible,
        setLoginToRedeemPopupVisible,
        getPhrase,
        setAccountCreatedForRedeemPopupVisible,
        isCreateAccountForbidden,
        isCreateAccountSending,
        isFormValid,
        validateVoucherAfterLogin,
    } = useStore((stores: IHolidaysStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isCreateAccountPopupVisible: stores.createAccountStore.isCreateAccountPopupVisible,
        setCreateAccountPopupVisible: stores.createAccountStore.setCreateAccountPopupVisible,
        setLoginToRedeemPopupVisible: stores.redeemVoucherStore.setLoginToRedeemPopupVisible,
        getPhrase: stores.layoutStore.getPhrase,
        setAccountCreatedForRedeemPopupVisible: stores.redeemVoucherStore.setAccountCreatedForRedeemPopupVisible,
        isCreateAccountForbidden: stores.createAccountStore.isCreateAccountForbidden,
        isCreateAccountSending: stores.createAccountStore.isCreateAccountSending,
        isFormValid: stores.createAccountStore.isFormValid,
        validateVoucherAfterLogin: stores.redeemVoucherStore.validateVoucherAfterLogin,
    }));

    const actionAfterUserCreated = async () => {
        await validateVoucherAfterLogin();
        setCreateAccountPopupVisible(false);
        setAccountCreatedForRedeemPopupVisible(true);
    };
    const [shouldSubmit, setShouldSubmit] = useState(false);
    const [isBackClicked, setIsBackClicked] = useState(false);

    useEffect(() => {
        if (isBackClicked) {
            setLoginToRedeemPopupVisible(true);
            setIsBackClicked(false);
        }
    }, [isBackClicked]);

    if (!props.fields) {
        return null;
    }

    const {
        fields: { data },
    } = props;

    const header = (
        <>
            <Text className='create-account-popup__subtitle' tag='h3' field={data.PopupSubtitle} />
            <Text className='create-account-popup__description' tag='p' field={data.PopupDescription} />
        </>
    );

    const buttons = (
        <>
            <Button
                onClick={() => {
                    isScreenMedium && setIsBackClicked(true);
                    setCreateAccountPopupVisible(false);
                    !isScreenMedium && setLoginToRedeemPopupVisible(true);
                }}
                isTransparent
                className='back-btn'
            >
                {getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
            </Button>
            <Button
                onClick={() => {
                    setShouldSubmit(true);
                }}
                hasDisabledStyles={!isFormValid || isCreateAccountForbidden}
                isLoading={isCreateAccountSending}
                className='continue-btn'
            >
                {getPhrase(SitecoreDictionary.LoginButtonsCreateAccount)}
            </Button>
        </>
    );

    const accountCreatedForRedeemPopup = (
        <AccountCreatedForRedeemPopup ContentSuccessPopup={data.ContentSuccessPopup} />
    );
    const resetShouldSubmit = () => setShouldSubmit(false);

    if (!isScreenMedium) {
        return (
            <>
                <Drawer open={isCreateAccountPopupVisible} className='redeem-popup create-account-popup'>
                    {!!data.PopupTitle && (
                        <Text className='create-account-popup__title' tag='legend' field={data.PopupTitle} />
                    )}
                    {header}
                    {isCreateAccountPopupVisible && (
                        <CreateAccount
                            {...props}
                            shouldSubmit={shouldSubmit}
                            actionAfterSubmitting={actionAfterUserCreated}
                            resetShouldSubmit={resetShouldSubmit}
                        />
                    )}
                    <div className='drawer__actions'>{buttons}</div>
                </Drawer>
                {accountCreatedForRedeemPopup}
            </>
        );
    }

    return (
        <>
            {isCreateAccountPopupVisible ? (
                <Popup
                    containerClass='create-account-popup redeem-popup '
                    onClose={() => {
                        setIsBackClicked(true);
                        setCreateAccountPopupVisible(false);
                    }}
                    showCloseButton
                    footerContent={buttons}
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPopup)}
                >
                    <div>
                        <Text className='create-account-popup__title' tag='h2' field={data.PopupTitle} />
                        <div className='create-account-popup__content'>
                            {header}

                            <CreateAccount
                                {...props}
                                shouldSubmit={shouldSubmit}
                                actionAfterSubmitting={actionAfterUserCreated}
                                resetShouldSubmit={resetShouldSubmit}
                            />
                        </div>
                    </div>
                </Popup>
            ) : null}
            {accountCreatedForRedeemPopup}
        </>
    );
};

export default observer(CreateAccountPopup);
