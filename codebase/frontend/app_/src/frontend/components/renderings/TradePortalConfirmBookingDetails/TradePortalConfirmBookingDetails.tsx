import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import BookingDetails from 'frontend/components/renderings/Payment/components/BookingDetails/BookingDetails';

import { ITradePortalConfirmBookingDetailsFields } from './interfaces';

import styles from './TradePortalConfirmBookingDetails.module.scss';

type TTradePortalConfirmBookingDetailsProps = ISitecoreComponent<ITradePortalConfirmBookingDetailsFields>;

export const TradePortalConfirmBookingDetails = (props: TTradePortalConfirmBookingDetailsProps) => {
    const { hasGuestInStorage } = useStore(({ guestDetailsStore }: ITradePortalStores) => ({
        hasGuestInStorage: guestDetailsStore.hasGuestInStorage,
    }));

    if (!props.fields || !hasGuestInStorage()) {
        return null;
    }

    const { Title } = props.fields || {};

    return (
        <div className='wrapper--solid'>
            <div className='wrapper-container wrapper-container--px pt-0'>
                {Title && <Text field={Title} tag='h1' className={classNames('page-title', styles.title)} />}
                <BookingDetails className='mb-0' fields={props.fields} />
            </div>
        </div>
    );
};

export default TradePortalConfirmBookingDetails;
