import * as React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LoginPopup from 'frontend/components/common/LoginPopup/LoginPopup';

import LoginDrawer from './components/LoginDrawer/LoginDrawer';

const LoginToViewBookingPopup = () => {
    const {
        isScreenLarge,
        isLoginPopupShown,
        toggleLoginPopup,
        onLogin,
        getPhrase,
        booking,
        isLoggedIn,
        redirectUrlLocal,
        customerLogin,
        loadBooking,
    } = useStore((stores: IHolidaysStores) => ({
        isScreenLarge: stores.appStore.isScreenLarge,
        isLoginPopupShown: stores.userStore.isLoginPopupShown,
        toggleLoginPopup: stores.userStore.toggleLoginPopup,
        onLogin: stores.userStore.onLogin,
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.viewBookingStore.booking,
        loggedInUserData: stores.userStore.userData,
        isLoggedIn: stores.userStore.isLoggedIn,
        redirectUrlLocal: stores.userStore.redirectUrlLocal,
        customerLogin: stores.userStore.customerLogin,
        loadBooking: stores.viewBookingStore.loadBooking,
    }));
    const isLeadLoggedIn = booking?.isLoggedInAsLeadPassenger;
    const bookingLeadLoginPopup = isLoggedIn && !isLeadLoggedIn;
    const title = bookingLeadLoginPopup
        ? getPhrase(SitecoreDictionary.LoginTitlesDifferentAccount)
        : getPhrase(SitecoreDictionary.LoginTitlesCreditMyBooking);
    const description = bookingLeadLoginPopup
        ? getPhrase(SitecoreDictionary.LoginDescriptionsDifferentAccount)
        : getPhrase(SitecoreDictionary.LoginDescriptionsCreditMyBooking);

    const afterLoginAction = (): void => {
        if (!customerLogin.errors.length && !redirectUrlLocal) {
            toggleLoginPopup();
            loadBooking(true);
            window.scrollTo(0, 0);
        }
    };

    const logoutIfLoggedIn = !bookingLeadLoginPopup;

    if (isScreenLarge) {
        return isLoginPopupShown ? (
            <LoginPopup
                title={title}
                description={description}
                popupClass='login-popup--view-booking'
                onClose={toggleLoginPopup}
                isHideRememberMe={!isLeadLoggedIn}
                logoutIfLoggedIn={logoutIfLoggedIn}
                afterLoginAction={afterLoginAction}
            />
        ) : null;
    }

    return (
        <LoginDrawer
            isShown={isLoginPopupShown}
            onLogin={(): void => {
                onLogin(logoutIfLoggedIn, afterLoginAction);
            }}
            title={title}
            description={description}
            onClose={toggleLoginPopup}
        />
    );
};

export default observer(LoginToViewBookingPopup);
