import React, { FC } from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './BookingCancelledStatusInfo.module.scss';

export interface IBookingCanceledStatusInfoProps extends IComponentWithDictionary {
    displayOnMobile?: boolean;
}

export const BookingCanceledStatusInfo: FC<IBookingCanceledStatusInfoProps> = ({ getPhrase, displayOnMobile }) => (
    <span
        className={classNames(styles.cancelledText, {
            [styles.mobile]: displayOnMobile,
            [styles.desktop]: !displayOnMobile,
        })}
        data-tid='booking-canceled-status-info'
    >
        <i className={styles.errorIcon}>
            <SvgWarningFilled />
        </i>
        {getPhrase(SitecoreDictionary.ViewBookingsLabelsHolidayCanceled)}
    </span>
);
export default inject((stores: IHolidaysStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
}))(BookingCanceledStatusInfo);
