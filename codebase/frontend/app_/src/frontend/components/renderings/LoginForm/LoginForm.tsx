import React, { FC, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { GuestBookingInfoFields } from 'models/data/GuestBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import MyBookingSection from './components/MyBookingSection';
import SingInSection from './components/SingInSection';

import styles from './LoginForm.module.scss';

export interface ILoginFormFields {
    AdditionalInfoDescription: ISitecoreField<string>;
    AdditionalInfoTitle: ISitecoreField<string>;
    LoginFormTitle: ISitecoreField<string>;
    ViewBookingFormDescription: ISitecoreField<string>;
    ViewBookingFormTitle: ISitecoreField<string>;
}

export type TLoginFormProps = ISitecoreComponent<ILoginFormFields>;

export const LoginForm: FC<TLoginFormProps> = ({ fields, rendering }) => {
    const {
        getPhrase,
        viewMyBooking,
        isLoginTabActive,
        isLoggedIn,
        setLoginTabActive,
        userData,
        guestBookingInfo,
        clearGuestBookingInfo,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        viewMyBooking: stores.queryParamStore.viewMyBooking,
        isLoginTabActive: stores.userStore.isLoginTabActive,
        isLoggedIn: stores.userStore.isLoggedIn,
        setLoginTabActive: stores.userStore.setLoginTabActive,
        userData: stores.userStore.userData,
        guestBookingInfo: stores.viewBookingStore.guestBookingInfo,
        clearGuestBookingInfo: stores.viewBookingStore.clearGuestBookingInfo,
    }));

    const changeLastName = () => {
        userData &&
            !guestBookingInfo.lastName &&
            guestBookingInfo.onChangeField(GuestBookingInfoFields.LastName, userData.lastName);
    };

    useEffect(() => {
        if (viewMyBooking()) {
            clearGuestBookingInfo();
            setLoginTabActive(false);
            changeLastName();
        }
    }, []);

    useEffect(() => {
        changeLastName();
    }, [userData]);

    if (!fields) {
        return null;
    }

    const {
        AdditionalInfoDescription,
        AdditionalInfoTitle,
        LoginFormTitle,
        ViewBookingFormDescription,
        ViewBookingFormTitle,
    } = fields;

    return (
        <div className={'wrapper-component-container login-form'}>
            {!isLoggedIn ? (
                <>
                    <div className='wrapper-component-container__inner'>
                        <Text field={LoginFormTitle} className={styles.title} tag='h2' />
                        <div className='login-form__container'>
                            <div className='form-tabs'>
                                <button
                                    onClick={() => setLoginTabActive(true)}
                                    className={classNames('btn', isLoginTabActive && 'btn--active')}
                                    data-tid='login-tab'
                                >
                                    {getPhrase(SitecoreDictionary.LoginLabelsLoginToMyAccount)}
                                </button>
                                <button
                                    onClick={() => setLoginTabActive(false)}
                                    className={classNames('btn', !isLoginTabActive && 'btn--active')}
                                    data-tid='view-booking-tab'
                                >
                                    {getPhrase(SitecoreDictionary.LoginLabelsViewMyBooking)}
                                </button>
                            </div>
                            {isLoginTabActive ? (
                                <SingInSection isCreateAccountSectionShown />
                            ) : (
                                <MyBookingSection rendering={rendering} />
                            )}
                        </div>
                    </div>
                    <div className='wrapper-component-container--grey'>
                        <div className='wrapper-component-container__inner'>
                            <Text
                                field={AdditionalInfoTitle}
                                className={classNames(styles.title, styles.infoTitle)}
                                tag='h2'
                                data-tid='additional-info-title'
                            />
                            <RichTextWithLinks
                                field={AdditionalInfoDescription}
                                className={styles.infoDescription}
                                dataId='additional-info-content'
                            />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className='wrapper--solid wrapper--solid--grey'>
                        <div className='wrapper-container wrapper-container--px'>
                            <Text field={ViewBookingFormTitle} className='page-title' tag='h2' />
                            <RichTextWithLinks field={ViewBookingFormDescription} className='login__description' />
                        </div>
                    </div>
                    <div className='wrapper--solid wrapper-triangle--g2t' />
                    <div className='login-form__container view-booking-container'>
                        <MyBookingSection rendering={rendering} />
                    </div>
                </>
            )}
        </div>
    );
};

export default observer(LoginForm);
