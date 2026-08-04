import React, { FunctionComponent } from 'react';
import { ComponentRendering, Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/ViewBookings/ViewBookings';

import styles from './NoBookings.module.scss';

interface INoBookingsProps extends IComponentWithDictionary {
    fields: IViewBookingsSitecoreFields | undefined;
    onAddBooking: () => void;
    rendering: ComponentRendering;
}

const NoBookings: FunctionComponent<INoBookingsProps> = props => {
    const { getPhrase, rendering, fields, onAddBooking } = props;
    const { NoBookingsTitle, NoBookingsDescription, IsNoBookingsButtonHidden } = fields || {};

    return (
        <div className='wrapper-component-container__inner'>
            <div className={styles.wrapper} data-tid='no-bookings-wrapper'>
                {!!NoBookingsTitle?.value && (
                    <div className={styles.titleWrapper} data-tid='no-bookings-title'>
                        <Text tag={'h2'} field={NoBookingsTitle} />
                    </div>
                )}

                {!!NoBookingsDescription && (
                    <Text
                        tag={'p'}
                        className={styles.description}
                        field={NoBookingsDescription}
                        data-tid='no-bookings-description'
                    />
                )}

                {!IsNoBookingsButtonHidden?.value && (
                    <Button dataTid='add-booking-button' onClick={onAddBooking}>
                        {getPhrase(SitecoreDictionary.ViewBookingsButtonsAddBooking)}
                    </Button>
                )}
            </div>
            <Placeholder name={PlaceholderNames.Content} rendering={rendering} />
        </div>
    );
};

export default NoBookings;
