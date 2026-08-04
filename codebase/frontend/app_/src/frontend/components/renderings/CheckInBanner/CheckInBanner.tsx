import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import Link from 'next/link';

import useStore from 'frontend/hooks/useStore';
import { getFlightsReferences } from 'frontend/utils/route.utils';
import { getCheckInLink } from 'frontend/utils/viewBooking.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './CheckInBanner.module.scss';

export interface ICheckInBannerFields {
    CTALabel: ISitecoreField<string>;
    Subtext: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TCheckInBannerProps = ISitecoreComponent<ICheckInBannerFields>;

const CheckInBanner: FC<TCheckInBannerProps> = ({ fields }) => {
    const { booking, getSetting, isCheckInAvailable } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
        getSetting: stores.layoutStore.getSetting,
        isCheckInAvailable: stores.bookingStore.isCheckInAvailable,
    }));

    if (!fields || !booking) {
        return null;
    }

    const { Title, Subtext, CTALabel } = fields;
    const checkInLink = getCheckInLink(booking, getSetting);

    const routes = booking.package?.transport?.routes || [];
    const flightReferences = getFlightsReferences(routes);
    const hasMultipleFlightsRefs = flightReferences.length > 1;
    const isBookingCanceled = booking.bookingStatus === BookingStatus.Canceled;

    if (!checkInLink || isBookingCanceled || !isCheckInAvailable(booking) || hasMultipleFlightsRefs) {
        return null;
    }

    return (
        <div className={styles.sizeContainer} data-tid='check-in-banner'>
            <div className={styles.container}>
                <div>
                    <Text tag='h2' className={styles.title} field={Title} data-tid='check-in-banner-title' />
                    <RichTextWithLinks className={styles.subtext} field={Subtext} dataId='check-in-banner-subtitle' />
                </div>
                <Link
                    legacyBehavior={false}
                    className={classNames(styles.ctaButton, 'btn btn--medium')}
                    href={checkInLink}
                    rel='noopener noreferrer'
                    target='_blank'
                >
                    {CTALabel.value}
                </Link>
            </div>
        </div>
    );
};

export default observer(CheckInBanner);
