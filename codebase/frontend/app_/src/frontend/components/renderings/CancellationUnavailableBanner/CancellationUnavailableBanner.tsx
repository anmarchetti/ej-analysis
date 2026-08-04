import React, { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import ExpandableBanner from 'frontend/components/common/ExpandableBanner/ExpandableBanner';

import styles from './CancellationUnavailableBanner.module.scss';

interface ICallToActionBlockFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

export type TCancellationUnavailableBannerProps = ISitecoreComponent<ICallToActionBlockFields>;

export const CancellationUnavailableBanner: FC<TCancellationUnavailableBannerProps> = ({ fields, rendering }) => {
    const { booking } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
    }));

    if (!fields || !booking?.cancellationIsBlocked || booking.isExternalAgency) {
        return null;
    }

    const { Title, Description, Icon } = fields;

    return (
        <ExpandableBanner
            Title={Title}
            Description={Description}
            Icon={Icon}
            dataTidPrefix='cancellation-unavailable-banner'
            button={
                <div className={styles.button}>
                    <Placeholder name={PlaceholderNames.ContactUs} rendering={rendering} isOutlined={false} />
                </div>
            }
        />
    );
};

export default observer(CancellationUnavailableBanner);
