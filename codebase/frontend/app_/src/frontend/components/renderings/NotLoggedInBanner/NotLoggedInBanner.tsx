import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import ExpandableBanner from 'frontend/components/common/ExpandableBanner/ExpandableBanner';

enum BookingViewType {
    NotLoggedIn = 'NotLoggedIn',
    LogWithDiffEmail = 'LogWithDiffEmail',
}

interface ICallToActionBlockFields {
    ButtonLabel: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

export interface ICallToActionBlockWithKeyFields extends ICallToActionBlockFields {
    Key: ISitecoreField<string>;
}

export interface INotLoggedInBannerFields {
    Children: ISitecoreChildren<ICallToActionBlockWithKeyFields>[];
}

export type TNotLoggedInBannerProps = ISitecoreComponent<INotLoggedInBannerFields>;

export const NotLoggedInBanner: FC<TNotLoggedInBannerProps> = ({ fields }) => {
    const { booking, isLoggedIn, setIsRedirectPreventedAfterLogin, setRedirectUrl, toggleLoginPopup } = useStore(
        (stores: IHolidaysStores) => ({
            booking: stores.viewBookingStore.booking,
            isLoggedIn: stores.userStore.isLoggedIn,
            setIsRedirectPreventedAfterLogin: stores.userStore.setIsRedirectPreventedAfterLogin,
            setRedirectUrl: stores.userStore.setRedirectUrl,
            toggleLoginPopup: stores.userStore.toggleLoginPopup,
        }),
    );

    if (
        !fields?.Children.length ||
        !booking ||
        booking.isExternalAgency ||
        (isLoggedIn && booking.isLoggedInAsLeadPassenger)
    ) {
        return null;
    }

    const contentType =
        isLoggedIn && !booking.isLoggedInAsLeadPassenger
            ? BookingViewType.LogWithDiffEmail
            : BookingViewType.NotLoggedIn;

    const contentItem = fields.Children.find(item => item.fields.Key.value === contentType);

    if (!contentItem) {
        return null;
    }

    const { Title, Description, ButtonLabel, Icon } = contentItem.fields;

    const onButtonClick = (): void => {
        setIsRedirectPreventedAfterLogin(true);
        setRedirectUrl('');
        toggleLoginPopup();
    };

    return (
        <ExpandableBanner
            Title={Title}
            Description={Description}
            ButtonLabel={ButtonLabel}
            Icon={Icon}
            onButtonClick={onButtonClick}
            dataTidPrefix='not-logged-in-banner'
        />
    );
};

export default observer(NotLoggedInBanner);
