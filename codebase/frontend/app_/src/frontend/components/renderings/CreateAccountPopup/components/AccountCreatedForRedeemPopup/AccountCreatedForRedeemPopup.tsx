import React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

export interface IAccountCreatedForRedeemPopupProps {
    ContentSuccessPopup: ISitecoreField<string>;
}

export const AccountCreatedForRedeemPopup = ({ ContentSuccessPopup }: IAccountCreatedForRedeemPopupProps) => {
    const {
        email,
        getPhrase,
        isAccountCreatedForRedeemPopupVisible,
        setAccountCreatedForRedeemPopupVisible,
        setValidatedVoucherPopupVisible,
        isScreenMedium,
    } = useStore((stores: IHolidaysStores) => ({
        email: stores.createAccountStore.customerLogin.email,
        getPhrase: stores.layoutStore.getPhrase,
        isAccountCreatedForRedeemPopupVisible: stores.redeemVoucherStore.isAccountCreatedForRedeemPopupVisible,
        setAccountCreatedForRedeemPopupVisible: stores.redeemVoucherStore.setAccountCreatedForRedeemPopupVisible,
        setValidatedVoucherPopupVisible: stores.redeemVoucherStore.setValidatedVoucherPopupVisible,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    const onContinue = async () => {
        setAccountCreatedForRedeemPopupVisible(false);
        setValidatedVoucherPopupVisible(true);
    };

    const content = (
        <>
            <h2 className='title'>{getPhrase(SitecoreDictionary.CreateAccountSuccessPopupAccountCreated)}</h2>
            <div className='content'>
                <RichTextWithLinks
                    field={{
                        ...ContentSuccessPopup,
                        value: Tokenizer.replaceToken(ContentSuccessPopup?.value, Tokens.Email, email || ''),
                    }}
                />
            </div>
        </>
    );

    const button = (
        <Button className='continue-btn' onClick={() => onContinue()}>
            {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
        </Button>
    );

    return isScreenMedium ? (
        isAccountCreatedForRedeemPopupVisible ? (
            <Popup
                containerClass='account-created-for-redeem-popup redeem-popup '
                showCloseButton
                isInnerPopup
                onClose={onContinue}
                footerContent={button}
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPopup)}
            >
                {content}
            </Popup>
        ) : null
    ) : (
        <Drawer open={isAccountCreatedForRedeemPopupVisible} className='account-created-for-redeem-popup redeem-popup'>
            {content}
            <div className='drawer__actions'>{button}</div>
        </Drawer>
    );
};

export default observer(AccountCreatedForRedeemPopup);
